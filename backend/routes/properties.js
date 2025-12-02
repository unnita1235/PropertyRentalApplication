const express = require('express');
const db = require('../database');
const { authenticateToken, isOwner } = require('../middleware/auth');

const router = express.Router();

// Get all properties (public/authenticated)
router.get('/', authenticateToken, (req, res) => {
  const query = `
    SELECT p.*, u.full_name as owner_name, u.email as owner_email
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.is_available = 1
    ORDER BY p.created_at DESC
  `;

  db.all(query, [], (err, properties) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(properties);
  });
});

// Get single property
router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT p.*, u.full_name as owner_name, u.email as owner_email
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `;

  db.get(query, [req.params.id], (err, property) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  });
});

// Get owner's properties
router.get('/owner/my-properties', authenticateToken, isOwner, (req, res) => {
  db.all(
    'SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, properties) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(properties);
    }
  );
});

// Create new property (Owner only)
router.post('/', authenticateToken, isOwner, (req, res) => {
  const {
    title,
    description,
    location,
    price_per_night,
    bedrooms,
    bathrooms,
    max_guests,
    amenities,
    image_url
  } = req.body;

  // Validation
  if (!title || !location || !price_per_night) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (price_per_night <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }

  const query = `
    INSERT INTO properties 
    (owner_id, title, description, location, price_per_night, bedrooms, bathrooms, max_guests, amenities, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      req.user.id,
      title,
      description,
      location,
      price_per_night,
      bedrooms || 1,
      bathrooms || 1,
      max_guests || 2,
      amenities,
      image_url
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create property' });
      }

      res.status(201).json({
        message: 'Property created successfully',
        propertyId: this.lastID
      });
    }
  );
});

// Update property (Owner only - their own property)
router.put('/:id', authenticateToken, isOwner, (req, res) => {
  const propertyId = req.params.id;

  // First check if property belongs to this owner
  db.get('SELECT * FROM properties WHERE id = ?', [propertyId], (err, property) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own properties' });
    }

    const {
      title,
      description,
      location,
      price_per_night,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      image_url,
      is_available
    } = req.body;

    const query = `
      UPDATE properties
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          location = COALESCE(?, location),
          price_per_night = COALESCE(?, price_per_night),
          bedrooms = COALESCE(?, bedrooms),
          bathrooms = COALESCE(?, bathrooms),
          max_guests = COALESCE(?, max_guests),
          amenities = COALESCE(?, amenities),
          image_url = COALESCE(?, image_url),
          is_available = COALESCE(?, is_available)
      WHERE id = ?
    `;

    db.run(
      query,
      [
        title,
        description,
        location,
        price_per_night,
        bedrooms,
        bathrooms,
        max_guests,
        amenities,
        image_url,
        is_available,
        propertyId
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update property' });
        }

        res.json({ message: 'Property updated successfully' });
      }
    );
  });
});

// Delete property (Owner only - their own property)
router.delete('/:id', authenticateToken, isOwner, (req, res) => {
  const propertyId = req.params.id;

  // First check if property belongs to this owner
  db.get('SELECT * FROM properties WHERE id = ?', [propertyId], (err, property) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own properties' });
    }

    db.run('DELETE FROM properties WHERE id = ?', [propertyId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete property' });
      }

      res.json({ message: 'Property deleted successfully' });
    });
  });
});

module.exports = router;