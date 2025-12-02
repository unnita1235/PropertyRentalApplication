const express = require('express');
const db = require('../database');
const { authenticateToken, isCustomer } = require('../middleware/auth');

const router = express.Router();

// Record payment (Customer only - after booking is approved)
router.post('/', authenticateToken, isCustomer, (req, res) => {
  const { booking_id, payment_method, transaction_id } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Get booking details
  db.get('SELECT * FROM bookings WHERE id = ?', [booking_id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if customer owns this booking
    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only pay for your own bookings' });
    }

    // Check if booking is approved
    if (booking.status !== 'Approved') {
      return res.status(400).json({ error: 'Payment can only be made for approved bookings' });
    }

    // Check if payment already exists
    db.get('SELECT * FROM payments WHERE booking_id = ?', [booking_id], (err, existingPayment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingPayment) {
        return res.status(409).json({ error: 'Payment already recorded for this booking' });
      }

      // Insert payment
      const insertPayment = `
        INSERT INTO payments (booking_id, amount, payment_method, transaction_id)
        VALUES (?, ?, ?, ?)
      `;

      db.run(
        insertPayment,
        [booking_id, booking.total_price, payment_method || 'Credit Card', transaction_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to record payment' });
          }

          // Update booking status to Completed
          db.run(
            'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['Completed', booking_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Payment recorded but failed to update booking status' });
              }

              res.status(201).json({
                message: 'Payment recorded successfully. Booking is now completed.',
                paymentId: this.lastID,
                amount: booking.total_price
              });
            }
          );
        }
      );
    });
  });
});

// Get payments for user's bookings
router.get('/my-payments', authenticateToken, (req, res) => {
  let query;
  let params;

  if (req.user.role === 'Customer') {
    // Get customer's payments
    query = `
      SELECT p.*, b.start_date, b.end_date, b.status as booking_status,
             pr.title as property_title, pr.location
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN properties pr ON b.property_id = pr.id
      WHERE b.customer_id = ?
      ORDER BY p.payment_date DESC
    `;
    params = [req.user.id];
  } else {
    // Get payments for owner's properties
    query = `
      SELECT p.*, b.start_date, b.end_date, b.status as booking_status,
             pr.title as property_title, pr.location,
             u.full_name as customer_name, u.email as customer_email
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN properties pr ON b.property_id = pr.id
      JOIN users u ON b.customer_id = u.id
      WHERE pr.owner_id = ?
      ORDER BY p.payment_date DESC
    `;
    params = [req.user.id];
  }

  db.all(query, params, (err, payments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(payments);
  });
});

// Get payment details
router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT p.*, b.customer_id, b.start_date, b.end_date, b.status as booking_status,
           pr.title as property_title, pr.location, pr.owner_id,
           c.full_name as customer_name, c.email as customer_email
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN properties pr ON b.property_id = pr.id
    JOIN users c ON b.customer_id = c.id
    WHERE p.id = ?
  `;

  db.get(query, [req.params.id], (err, payment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check authorization
    if (payment.customer_id !== req.user.id && payment.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(payment);
  });
});

module.exports = router;