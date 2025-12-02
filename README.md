Property Rental Platform
A full-stack web application for property rental management with role-based access control, booking workflows, and payment tracking.

📋 Table of Contents
Features
Technology Stack
Installation
Usage
API Documentation
Database Schema
Sample Credentials
Project Structure
Assumptions
✨ Features
Authentication & Authorization
Secure user registration and login
Password hashing using bcrypt
JWT-based authentication
Role-based access control (Owner/Customer)
Owner Features
Create, update, and delete properties
View all owned properties
Receive and manage booking requests
Approve or reject bookings
View payment history
Customer Features
Browse all available properties
Request bookings with date selection
View booking status
Make payments for approved bookings
View payment history
Booking Workflow
Pending: Initial state when customer requests booking
Approved: Owner accepts the booking request
Rejected: Owner declines the booking request
Completed: Customer submits payment after approval
🛠 Technology Stack
Backend
Node.js - Runtime environment
Express.js - Web framework
SQLite3 - Database
bcryptjs - Password hashing
jsonwebtoken - JWT authentication
dotenv - Environment variables
Frontend
HTML5 - Structure
CSS3 - Styling
Vanilla JavaScript - Client-side logic
Fetch API - HTTP requests
📦 Installation
Prerequisites
Node.js (v14 or higher)
npm (comes with Node.js)
Step-by-Step Setup
Open Command Prompt and navigate to the backend folder:
bash
cd /d D:\PropertyRentalApplication\backend
Install dependencies:
bash
npm install
Start the server:
bash
npm start
The server will start on http://localhost:5000

Open your browser and go to:
http://localhost:5000
🚀 Usage
First Time Setup
The application automatically creates a SQLite database on first run
Sample data (users and properties) is automatically populated
Use the sample credentials below to login
Sample Credentials
Owner Account:

Email: owner@example.com
Password: owner123
Customer Account:

Email: customer@example.com
Password: customer123
Typical Workflows
Owner Workflow:
Login as Owner
Create new properties
View booking requests
Approve/Reject bookings
View payments received
Customer Workflow:
Login as Customer
Browse available properties
Request booking with dates
Wait for owner approval
Make payment after approval
View booking and payment history
📚 API Documentation
Authentication Endpoints
Register User
http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "Owner" | "Customer"
}
Login
http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
Get Current User
http
GET /api/auth/me
Authorization: Bearer {token}
Property Endpoints
Get All Properties
http
GET /api/properties
Authorization: Bearer {token}
Get Owner's Properties
http
GET /api/properties/owner/my-properties
Authorization: Bearer {token}
Create Property (Owner only)
http
POST /api/properties
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Beach House",
  "description": "Beautiful ocean view",
  "location": "Miami, FL",
  "price_per_night": 250.00,
  "bedrooms": 3,
  "bathrooms": 2,
  "max_guests": 6,
  "amenities": "WiFi,Pool,Parking"
}
Update Property (Owner only)
http
PUT /api/properties/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "price_per_night": 300.00
}
Delete Property (Owner only)
http
DELETE /api/properties/:id
Authorization: Bearer {token}
Booking Endpoints
Create Booking (Customer only)
http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "property_id": 1,
  "start_date": "2024-12-10",
  "end_date": "2024-12-15"
}
Get User's Bookings
http
GET /api/bookings/my-bookings
Authorization: Bearer {token}
Approve Booking (Owner only)
http
PATCH /api/bookings/:id/approve
Authorization: Bearer {token}
Reject Booking (Owner only)
http
PATCH /api/bookings/:id/reject
Authorization: Bearer {token}
Payment Endpoints
Submit Payment (Customer only)
http
POST /api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "payment_method": "Credit Card",
  "transaction_id": "TXN123456"
}
Get User's Payments
http
GET /api/payments/my-payments
Authorization: Bearer {token}
🗄 Database Schema
Users Table
sql
- id (INTEGER, PRIMARY KEY)
- email (TEXT, UNIQUE)
- password_hash (TEXT)
- role (TEXT: 'Owner' | 'Customer')
- full_name (TEXT)
- phone (TEXT)
- created_at (DATETIME)
Properties Table
sql
- id (INTEGER, PRIMARY KEY)
- owner_id (INTEGER, FOREIGN KEY -> users.id)
- title (TEXT)
- description (TEXT)
- location (TEXT)
- price_per_night (REAL)
- bedrooms (INTEGER)
- bathrooms (INTEGER)
- max_guests (INTEGER)
- amenities (TEXT)
- image_url (TEXT)
- is_available (INTEGER)
- created_at (DATETIME)
Bookings Table
sql
- id (INTEGER, PRIMARY KEY)
- property_id (INTEGER, FOREIGN KEY -> properties.id)
- customer_id (INTEGER, FOREIGN KEY -> users.id)
- start_date (DATE)
- end_date (DATE)
- total_price (REAL)
- status (TEXT: 'Pending' | 'Approved' | 'Rejected' | 'Completed')
- created_at (DATETIME)
- updated_at (DATETIME)
Payments Table
sql
- id (INTEGER, PRIMARY KEY)
- booking_id (INTEGER, FOREIGN KEY -> bookings.id)
- amount (REAL)
- payment_method (TEXT)
- transaction_id (TEXT)
- payment_status (TEXT)
- payment_date (DATETIME)
📁 Project Structure
PropertyRentalApplication/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── properties.js        # Property routes
│   │   ├── bookings.js          # Booking routes
│   │   └── payments.js          # Payment routes
│   ├── database.js              # Database setup and initialization
│   ├── server.js                # Express server
│   ├── package.json             # Dependencies
│   ├── .env                     # Environment variables
│   └── rental.db                # SQLite database (auto-generated)
├── frontend/
│   ├── index.html               # Main HTML file
│   ├── style.css                # Styles
│   └── app.js                   # Client-side JavaScript
├── database/
│   └── ER_Diagram.md            # Entity-Relationship diagram
└── README.md                    # This file
📝 Assumptions
Authentication: JWT tokens are stored in localStorage and expire after 24 hours
Database: SQLite is used for simplicity; production should use PostgreSQL/MySQL
File Uploads: Property images are stored as URLs (not uploaded files)
Date Validation: Bookings cannot be made for past dates
Overlapping Bookings: System prevents double-booking of properties
Payment Processing: Simplified payment recording (no actual payment gateway integration)
Authorization:
Owners can only modify their own properties
Customers can only book properties and pay for their bookings
Only property owners can approve/reject bookings for their properties
Booking Status: Once a booking is rejected or completed, status cannot be changed
Payment: Only approved bookings can receive payments
Data Persistence: All data is stored in SQLite database file
🔐 Security Features
Password hashing with bcrypt (10 rounds)
JWT-based stateless authentication
Role-based access control
Authorization checks on all protected routes
Input validation
SQL injection prevention through parameterized queries
🐛 Known Limitations
No email notifications
No payment gateway integration
No image upload functionality
No advanced search/filtering
No reviews or ratings system
No booking cancellation feature
Limited error handling in frontend
No admin role for system management
🚀 Future Enhancements
Add image upload for properties
Integrate real payment gateway (Stripe/PayPal)
Email notifications for bookings
Reviews and ratings system
Advanced search and filters
Booking cancellation with refund logic
Calendar view for availability
Chat/messaging between owners and customers
Analytics dashboard
Mobile responsive improvements
📄 License
MIT License - Feel free to use this project for learning and development purposes.

👨‍💻 Support
For issues or questions, please check:

All dependencies are installed correctly
Server is running on port 5000
No other application is using port 5000
Node.js version is 14 or higher
Built with ❤️ for Property Rental Management

