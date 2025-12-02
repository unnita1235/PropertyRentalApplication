const express = require('express');
const db = require('../database');
const { authenticateToken, isCustomer } = require('../middleware/auth');

const router = express.Router();

// Create booking (Customer only)
router.post('/', authenticateToken, isCustomer, (req, res) => {
  const { property_id, start_date, end_date } = req.body;

  if (!property_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return res.status(400).json({ error: 'Start date cannot be in the past' });
  }

  if (endDate <= startDate) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  // Get property details
  db.get('SELECT * FROM properties WHERE id = ?', [property_id], (err, property) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!property.is_available) {
      return res.status(400).json({ error: 'Property is not available' });
    }

    // Check for overlapping bookings
    const overlapQuery = `
      SELECT * FROM bookings
      WHERE property_id = ?
      AND status IN ('Pending', 'Approved')
      AND (
        (start_date <= ? AND end_date > ?)
        OR (start_date < ? AND end_date >= ?)
        OR (start_date >= ? AND end_date <= ?)
      )
    `;

    db.get(
      overlapQuery,
      [property_id, start_date, start_date, end_date, end_date, start_date, end_date],
      (err, overlap) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (overlap) {
          return res.status(409).json({ error: 'Property already booked for selected dates' });
        }

        // Calculate total price
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const total_price = days * property.price_per_night;

        // Create booking
        const insertQuery = `
          INSERT INTO bookings (property_id, customer_id, start_date, end_date, total_price, status)
          VALUES (?, ?, ?, ?, ?, 'Pending')
        `;

        db.run(
          insertQuery,
          [property_id, req.user.id, start_date, end_date, total_price],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create booking' });
            }

            res.status(201).json({
              message: 'Booking request created successfully',
              bookingId: this.lastID,
              total_price,
              nights: days
            });
          }
        );
      }
    );
  });
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, (req, res) => {
  let query;
  let params;

  if (req.user.role === 'Customer') {
    // Get bookings made by customer
    query = `
      SELECT b.*, p.title as property_title, p.location, p.price_per_night,
             u.full_name as owner_name, u.email as owner_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON p.owner_id = u.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `;
    params = [req.user.id];
  } else {
    // Get bookings for owner's properties
    query = `
      SELECT b.*, p.title as property_title, p.location,
             u.full_name as customer_name, u.email as customer_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.customer_id = u.id
      WHERE p.owner_id = ?
      ORDER BY b.created_at DESC
    `;
    params = [req.user.id];
  }

  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(bookings);
  });
});

// Get single booking
router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT b.*, p.title as property_title, p.location, p.owner_id,
           c.full_name as customer_name, c.email as customer_email,
           o.full_name as owner_name, o.email as owner_email
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users c ON b.customer_id = c.id
    JOIN users o ON p.owner_id = o.id
    WHERE b.id = ?
  `;

  db.get(query, [req.params.id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.customer_id !== req.user.id && booking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  });
});

// Approve booking (Owner only)
router.patch('/:id/approve', authenticateToken, (req, res) => {
  const bookingId = req.params.id;

  // Get booking details with property owner
  const query = `
    SELECT b.*, p.owner_id
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    WHERE b.id = ?
  `;

  db.get(query, [bookingId], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is the property owner
    if (booking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only property owner can approve bookings' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending bookings can be approved' });
    }

    db.run(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Approved', bookingId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to approve booking' });
        }

        res.json({ message: 'Booking approved successfully' });
      }
    );
  });
});

// Reject booking (Owner only)
router.patch('/:id/reject', authenticateToken, (req, res) => {
  const bookingId = req.params.id;

  // Get booking details with property owner
  const query = `
    SELECT b.*, p.owner_id
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    WHERE b.id = ?
  `;

  db.get(query, [bookingId], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is the property owner
    if (booking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only property owner can reject bookings' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending bookings can be rejected' });
    }

    db.run(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Rejected', bookingId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to reject booking' });
        }

        res.json({ message: 'Booking rejected successfully' });
      }
    );
  });
});

module.exports = router;