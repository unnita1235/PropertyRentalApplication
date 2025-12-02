const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Check if user is authenticated
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (authToken && user) {
        currentUser = JSON.parse(user);
        showDashboard();
    } else {
        showAuthSection();
    }
}

// Show/Hide sections
function showAuthSection() {
    document.getElementById('auth-section').classList.add('active');
    document.getElementById('dashboard-section').classList.remove('active');
    document.getElementById('nav-links').innerHTML = '';
}

function showDashboard() {
    document.getElementById('auth-section').classList.remove('active');
    document.getElementById('dashboard-section').classList.add('active');
    
    // Update nav
    document.getElementById('nav-links').innerHTML = `
        <span>Welcome, ${currentUser.full_name} (${currentUser.role})</span>
        <button class="btn btn-small btn-danger" onclick="logout()">Logout</button>
    `;
    
    // Show appropriate dashboard
    if (currentUser.role === 'Owner') {
        document.getElementById('owner-dashboard').style.display = 'block';
        document.getElementById('customer-dashboard').style.display = 'none';
        loadMyProperties();
    } else {
        document.getElementById('owner-dashboard').style.display = 'none';
        document.getElementById('customer-dashboard').style.display = 'block';
        loadProperties();
    }
}

// Auth functions
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showNotification('Login successful!', 'success');
            showDashboard();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Connection error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const full_name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, phone, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Registration successful! Please login.', 'success');
            showTab('login');
            document.getElementById('login-email').value = email;
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showNotification('Connection error. Please try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showNotification('Logged out successfully', 'info');
    showAuthSection();
}

// API helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    
    return data;
}

// Property functions
async function loadProperties() {
    try {
        const properties = await apiCall('/properties');
        displayProperties(properties, 'customer-content');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadMyProperties() {
    try {
        const properties = await apiCall('/properties/owner/my-properties');
        displayMyProperties(properties);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function displayProperties(properties, containerId) {
    const container = document.getElementById(containerId);
    
    if (properties.length === 0) {
        container.innerHTML = '<div class="empty-state"><h2>No properties available</h2></div>';
        return;
    }
    
    let html = '<div class="card-grid">';
    properties.forEach(prop => {
        html += `
            <div class="card">
                <h3>${prop.title}</h3>
                <div class="property-info">
                    <p><strong>Location:</strong> ${prop.location}</p>
                    <p><strong>Price:</strong> $${prop.price_per_night}/night</p>
                    <p><strong>Bedrooms:</strong> ${prop.bedrooms} | <strong>Bathrooms:</strong> ${prop.bathrooms}</p>
                    <p><strong>Max Guests:</strong> ${prop.max_guests}</p>
                    ${prop.amenities ? `<p><strong>Amenities:</strong> ${prop.amenities}</p>` : ''}
                    <p>${prop.description || ''}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary btn-small" onclick="showBookingForm(${prop.id}, '${prop.title}', ${prop.price_per_night})">
                        Book Now
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function displayMyProperties(properties) {
    const container = document.getElementById('owner-content');
    
    if (properties.length === 0) {
        container.innerHTML = '<div class="empty-state"><h2>You haven\'t added any properties yet</h2><p>Click "Add New Property" to get started</p></div>';
        return;
    }
    
    let html = '<div class="card-grid">';
    properties.forEach(prop => {
        html += `
            <div class="card">
                <h3>${prop.title}</h3>
                <div class="property-info">
                    <p><strong>Location:</strong> ${prop.location}</p>
                    <p><strong>Price:</strong> $${prop.price_per_night}/night</p>
                    <p><strong>Bedrooms:</strong> ${prop.bedrooms} | <strong>Bathrooms:</strong> ${prop.bathrooms}</p>
                    <p><strong>Status:</strong> ${prop.is_available ? '✅ Available' : '❌ Unavailable'}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-small" onclick="editProperty(${prop.id})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteProperty(${prop.id}, '${prop.title}')">Delete</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function showCreateProperty() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Add New Property</h2>
        <form onsubmit="createProperty(event)">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="prop-title" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="prop-description"></textarea>
            </div>
            <div class="form-group">
                <label>Location *</label>
                <input type="text" id="prop-location" required>
            </div>
            <div class="form-group">
                <label>Price per Night ($) *</label>
                <input type="number" id="prop-price" step="0.01" min="1" required>
            </div>
            <div class="form-group">
                <label>Bedrooms</label>
                <input type="number" id="prop-bedrooms" value="1" min="1">
            </div>
            <div class="form-group">
                <label>Bathrooms</label>
                <input type="number" id="prop-bathrooms" value="1" min="1">
            </div>
            <div class="form-group">
                <label>Max Guests</label>
                <input type="number" id="prop-guests" value="2" min="1">
            </div>
            <div class="form-group">
                <label>Amenities (comma-separated)</label>
                <input type="text" id="prop-amenities" placeholder="WiFi, Pool, Parking">
            </div>
            <button type="submit" class="btn btn-primary">Create Property</button>
        </form>
    `;
    openModal();
}

async function createProperty(e) {
    e.preventDefault();
    
    const propertyData = {
        title: document.getElementById('prop-title').value,
        description: document.getElementById('prop-description').value,
        location: document.getElementById('prop-location').value,
        price_per_night: parseFloat(document.getElementById('prop-price').value),
        bedrooms: parseInt(document.getElementById('prop-bedrooms').value),
        bathrooms: parseInt(document.getElementById('prop-bathrooms').value),
        max_guests: parseInt(document.getElementById('prop-guests').value),
        amenities: document.getElementById('prop-amenities').value
    };
    
    try {
        await apiCall('/properties', 'POST', propertyData);
        showNotification('Property created successfully!', 'success');
        closeModal();
        loadMyProperties();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteProperty(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
        await apiCall(`/properties/${id}`, 'DELETE');
        showNotification('Property deleted successfully', 'success');
        loadMyProperties();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Booking functions
function showBookingForm(propertyId, title, pricePerNight) {
    const today = new Date().toISOString().split('T')[0];
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Book: ${title}</h2>
        <form onsubmit="createBooking(event, ${propertyId}, ${pricePerNight})">
            <div class="form-group">
                <label>Check-in Date *</label>
                <input type="date" id="booking-start" min="${today}" required>
            </div>
            <div class="form-group">
                <label>Check-out Date *</label>
                <input type="date" id="booking-end" min="${today}" required>
            </div>
            <p id="booking-total" style="font-size: 1.2rem; font-weight: bold; margin: 1rem 0;"></p>
            <button type="submit" class="btn btn-primary">Request Booking</button>
        </form>
    `;
    
    // Calculate total when dates change
    document.getElementById('booking-start').addEventListener('change', () => calculateBookingTotal(pricePerNight));
    document.getElementById('booking-end').addEventListener('change', () => calculateBookingTotal(pricePerNight));
    
    openModal();
}

function calculateBookingTotal(pricePerNight) {
    const start = new Date(document.getElementById('booking-start').value);
    const end = new Date(document.getElementById('booking-end').value);
    
    if (start && end && end > start) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const total = days * pricePerNight;
        document.getElementById('booking-total').textContent = `Total: $${total.toFixed(2)} (${days} nights)`;
    }
}

async function createBooking(e, propertyId, pricePerNight) {
    e.preventDefault();
    
    const bookingData = {
        property_id: propertyId,
        start_date: document.getElementById('booking-start').value,
        end_date: document.getElementById('booking-end').value
    };
    
    try {
        const result = await apiCall('/bookings', 'POST', bookingData);
        showNotification(`Booking request submitted! Total: $${result.total_price}`, 'success');
        closeModal();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadMyBookings() {
    try {
        const bookings = await apiCall('/bookings/my-bookings');
        displayBookings(bookings, 'customer-content');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadBookings() {
    try {
        const bookings = await apiCall('/bookings/my-bookings');
        displayOwnerBookings(bookings);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function displayBookings(bookings, containerId) {
    const container = document.getElementById(containerId);
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-state"><h2>No bookings yet</h2></div>';
        return;
    }
    
    let html = '<div class="card-grid">';
    bookings.forEach(booking => {
        const statusClass = `status-${booking.status.toLowerCase()}`;
        html += `
            <div class="card">
                <h3>${booking.property_title}</h3>
                <div class="booking-info">
                    <p><strong>Location:</strong> ${booking.location}</p>
                    <p><strong>Check-in:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> $${booking.total_price}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${booking.status}</span></p>
                </div>
                <div class="card-actions">
                    ${booking.status === 'Approved' ? `
                        <button class="btn btn-success btn-small" onclick="showPaymentForm(${booking.id}, ${booking.total_price})">
                            Pay Now
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function displayOwnerBookings(bookings) {
    const container = document.getElementById('owner-content');
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-state"><h2>No booking requests yet</h2></div>';
        return;
    }
    
    let html = '<div class="card-grid">';
    bookings.forEach(booking => {
        const statusClass = `status-${booking.status.toLowerCase()}`;
        html += `
            <div class="card">
                <h3>${booking.property_title}</h3>
                <div class="booking-info">
                    <p><strong>Customer:</strong> ${booking.customer_name}</p>
                    <p><strong>Email:</strong> ${booking.customer_email}</p>
                    <p><strong>Check-in:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> $${booking.total_price}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${booking.status}</span></p>
                </div>
                <div class="card-actions">
                    ${booking.status === 'Pending' ? `
                        <button class="btn btn-success btn-small" onclick="approveBooking(${booking.id})">
                            Approve
                        </button>
                        <button class="btn btn-danger btn-small" onclick="rejectBooking(${booking.id})">
                            Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

async function approveBooking(id) {
    try {
        await apiCall(`/bookings/${id}/approve`, 'PATCH');
        showNotification('Booking approved!', 'success');
        loadBookings();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function rejectBooking(id) {
    try {
        await apiCall(`/bookings/${id}/reject`, 'PATCH');
        showNotification('Booking rejected', 'info');
        loadBookings();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Payment functions
function showPaymentForm(bookingId, amount) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Payment</h2>
        <p style="font-size: 1.2rem; margin: 1rem 0;"><strong>Amount: $${amount}</strong></p>
        <form onsubmit="submitPayment(event, ${bookingId})">
            <div class="form-group">
                <label>Payment Method *</label>
                <select id="payment-method" required>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                </select>
            </div>
            <div class="form-group">
                <label>Transaction ID (optional)</label>
                <input type="text" id="transaction-id" placeholder="e.g., TXN123456">
            </div>
            <button type="submit" class="btn btn-primary">Submit Payment</button>
        </form>
    `;
    openModal();
}

async function submitPayment(e, bookingId) {
    e.preventDefault();
    
    const paymentData = {
        booking_id: bookingId,
        payment_method: document.getElementById('payment-method').value,
        transaction_id: document.getElementById('transaction-id').value
    };
    
    try {
        await apiCall('/payments', 'POST', paymentData);
        showNotification('Payment recorded successfully! Booking is now completed.', 'success');
        closeModal();
        loadMyBookings();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadMyPayments() {
    try {
        const payments = await apiCall('/payments/my-payments');
        displayPayments(payments);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function displayPayments(payments) {
    const container = document.getElementById('customer-content');
    
    if (payments.length === 0) {
        container.innerHTML = '<div class="empty-state"><h2>No payments yet</h2></div>';
        return;
    }
    
    let html = '<div class="card-grid">';
    payments.forEach(payment => {
        html += `
            <div class="card">
                <h3>${payment.property_title}</h3>
                <div class="booking-info">
                    <p><strong>Location:</strong> ${payment.location}</p>
                    <p><strong>Amount:</strong> $${payment.amount}</p>
                    <p><strong>Payment Method:</strong> ${payment.payment_method}</p>
                    <p><strong>Transaction ID:</strong> ${payment.transaction_id || 'N/A'}</p>
                    <p><strong>Payment Date:</strong> ${new Date(payment.payment_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-completed">${payment.payment_status}</span></p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Modal functions
function openModal() {
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}