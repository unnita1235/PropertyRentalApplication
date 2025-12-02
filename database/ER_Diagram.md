# Entity-Relationship Diagram

## Property Rental Platform - Database Schema

```
┌──────────────────────────────────────┐
│             USERS                    │
├──────────────────────────────────────┤
│ PK  id                  INTEGER      │
│     email               TEXT         │
│     password_hash       TEXT         │
│     role                TEXT         │
│     full_name           TEXT         │
│     phone               TEXT         │
│     created_at          DATETIME     │
└──────────────────────────────────────┘
         │                      │
         │ 1                    │ 1
         │                      │
         │ owns                 │ makes
         │                      │
         │ *                    │ *
         ▼                      ▼
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│          PROPERTIES                  │     │           BOOKINGS                   │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ PK  id                  INTEGER      │ 1   │ PK  id                  INTEGER      │
│ FK  owner_id            INTEGER      │─────│ FK  property_id         INTEGER      │
│     title               TEXT         │  *  │ FK  customer_id         INTEGER      │
│     description         TEXT         │     │     start_date          DATE         │
│     location            TEXT         │     │     end_date            DATE         │
│     price_per_night     REAL         │     │     total_price         REAL         │
│     bedrooms            INTEGER      │     │     status              TEXT         │
│     bathrooms           INTEGER      │     │     created_at          DATETIME     │
│     max_guests          INTEGER      │     │     updated_at          DATETIME     │
│     amenities           TEXT         │     └──────────────────────────────────────┘
│     image_url           TEXT         │                  │
│     is_available        INTEGER      │                  │ 1
│     created_at          DATETIME     │                  │
└──────────────────────────────────────┘                  │ has
                                                           │
                                                           │ 1
                                                           ▼
                                              ┌──────────────────────────────────────┐
                                              │           PAYMENTS                   │
                                              ├──────────────────────────────────────┤
                                              │ PK  id                  INTEGER      │
                                              │ FK  booking_id          INTEGER      │
                                              │     amount              REAL         │
                                              │     payment_method      TEXT         │
                                              │     transaction_id      TEXT         │
                                              │     payment_status      TEXT         │
                                              │     payment_date        DATETIME     │
                                              └──────────────────────────────────────┘
```

## Relationships

### USERS → PROPERTIES (One-to-Many)
- One Owner can have multiple Properties
- Each Property belongs to one Owner
- FK: `properties.owner_id` → `users.id`
- Constraint: ON DELETE CASCADE

### USERS → BOOKINGS (One-to-Many)
- One Customer can make multiple Bookings
- Each Booking is made by one Customer
- FK: `bookings.customer_id` → `users.id`
- Constraint: ON DELETE CASCADE

### PROPERTIES → BOOKINGS (One-to-Many)
- One Property can have multiple Bookings
- Each Booking is for one Property
- FK: `bookings.property_id` → `properties.id`
- Constraint: ON DELETE CASCADE

### BOOKINGS → PAYMENTS (One-to-One)
- One Booking has exactly one Payment
- Each Payment is for one Booking
- FK: `payments.booking_id` → `bookings.id`
- Constraint: UNIQUE, ON DELETE CASCADE

## Detailed Table Descriptions

### USERS
Stores all user accounts (both Owners and Customers)
- **role**: Enum ('Owner', 'Customer')
- **password_hash**: bcrypt hashed password
- Unique constraint on `email`

### PROPERTIES
Stores rental property listings
- **owner_id**: Foreign key to USERS (Owner role)
- **price_per_night**: Decimal value for nightly rate
- **is_available**: Boolean (1=available, 0=unavailable)
- **amenities**: Comma-separated string

### BOOKINGS
Stores booking requests and their status
- **status**: Enum ('Pending', 'Approved', 'Rejected', 'Completed')
- **total_price**: Calculated as (end_date - start_date) × price_per_night
- Business logic prevents overlapping bookings

### PAYMENTS
Stores payment records
- One-to-one relationship with BOOKINGS
- Only created after booking is approved
- Booking status changes to 'Completed' after payment

## Business Rules

1. **User Registration**
   - Email must be unique
   - Password must be at least 6 characters
   - Role must be either 'Owner' or 'Customer'

2. **Property Management**
   - Only Owners can create properties
   - Owners can only modify/delete their own properties

3. **Booking Workflow**
   - Customers can request bookings for any available property
   - Start date must be in the future
   - End date must be after start date
   - No overlapping bookings allowed for same property
   - Only property owner can approve/reject bookings
   - Status flow: Pending → Approved/Rejected → Completed

4. **Payment Processing**
   - Payments can only be made for Approved bookings
   - One payment per booking (enforced by UNIQUE constraint)
   - Booking automatically becomes 'Completed' after payment

## Indexes

Recommended indexes for performance:
```sql
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
```

## Database Integrity

- All foreign keys have ON DELETE CASCADE
- UNIQUE constraints prevent duplicate emails and duplicate payments
- CHECK constraints enforce valid enum values
- NOT NULL constraints on required fields
- DEFAULT values for timestamps and status fields