const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'rental.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Owner', 'Customer')),
        full_name TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Properties table
    db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        price_per_night REAL NOT NULL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        max_guests INTEGER,
        amenities TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Bookings table
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL UNIQUE,
        amount REAL NOT NULL,
        payment_method TEXT,
        transaction_id TEXT,
        payment_status TEXT DEFAULT 'Completed',
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `, async (err) => {
      if (!err) {
        await createSampleData();
      }
    });
  });
}

async function createSampleData() {
  // Check if sample data already exists
  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (row.count === 0) {
      const ownerPass = await bcrypt.hash('owner123', 10);
      const customerPass = await bcrypt.hash('customer123', 10);

      // Insert sample users
      db.run(`
        INSERT INTO users (email, password_hash, role, full_name, phone)
        VALUES 
          ('owner@example.com', ?, 'Owner', 'John Owner', '+1234567890'),
          ('customer@example.com', ?, 'Customer', 'Jane Customer', '+0987654321')
      `, [ownerPass, customerPass]);

      // Insert sample properties
      db.run(`
        INSERT INTO properties (owner_id, title, description, location, price_per_night, bedrooms, bathrooms, max_guests, amenities)
        VALUES 
          (1, 'Luxury Beach House', 'Beautiful beachfront property with stunning ocean views', 'Miami Beach, FL', 250.00, 3, 2, 6, 'WiFi,Pool,Beach Access,Parking'),
          (1, 'Downtown Apartment', 'Modern apartment in the heart of the city', 'New York, NY', 150.00, 2, 1, 4, 'WiFi,Gym,Parking'),
          (1, 'Mountain Cabin', 'Cozy cabin surrounded by nature', 'Aspen, CO', 180.00, 2, 1, 4, 'WiFi,Fireplace,Hiking Trails')
      `);

      console.log('Sample data created successfully!');
      console.log('\n=== SAMPLE CREDENTIALS ===');
      console.log('Owner Account:');
      console.log('  Email: owner@example.com');
      console.log('  Password: owner123');
      console.log('\nCustomer Account:');
      console.log('  Email: customer@example.com');
      console.log('  Password: customer123');
      console.log('========================\n');
    }
  });
}

module.exports = db;