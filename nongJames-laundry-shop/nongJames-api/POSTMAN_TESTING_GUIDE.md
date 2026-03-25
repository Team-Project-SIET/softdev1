# NongJames Laundry API - Postman Testing Guide

## ✅ Backend Status

**Compilation Status**: ✅ All TypeScript files compile successfully with NO errors  
**Runtime**: Elysia + Bun  
**API Version**: 1.0.0  
**Base URL**: `http://localhost:3000`

---

## 🚀 How to Start the API (After Setup)

### Prerequisites
1. **PostgreSQL Database** running on localhost:5432
2. **Node.js** or **Bun** installed
3. **Environment variables** in `.env` file configured

### Start Command
```bash
# Navigate to project directory
cd nongJames-laundry-shop/nongJames-api

# Option 1: Using Bun (Recommended)
bun run dev      # Development with watch
bun run start    # Production

# Option 2: Using npm/Node.js
npm run dev      # Development with watch
npm run start    # Production
```

### Expected Output
```
🚀 NongJames Laundry API running at http://localhost:3000
📚 API Docs: http://localhost:3000/docs
💡 Health check: GET /health
```

---

## 📋 API Endpoints Reference

### 1. **AUTHENTICATION** (`/api/auth`)

#### 1.1 Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CUSTOMER"
}
```

**Roles**: `ADMIN` | `STAFF` | `DRIVER` | `CUSTOMER`

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

---

#### 1.2 Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

---

#### 1.3 Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

---

#### 1.4 Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGc...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "phone": "+66812345678",
    "createdAt": "2026-03-25T10:00:00Z"
  }
}
```

---

#### 1.5 Logout
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGc...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### 2. **ORDERS** (`/api/orders`)

#### 2.1 Create Order (Admin/Staff Only)
```http
POST /api/orders
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "customerId": "uuid",
  "orderType": "B2C",
  "pickupAddress": "123 Main St, Bangkok",
  "deliveryAddress": "456 Oak Ave, Bangkok",
  "items": [
    {
      "serviceId": "uuid",
      "quantity": 5,
      "unitPrice": 50
    },
    {
      "serviceId": "uuid",
      "quantity": 3,
      "unitPrice": 75
    }
  ],
  "notes": "Dry clean only, no starch"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "orderNumber": "NJ-20260325-547",
    "customerId": "uuid",
    "status": "PENDING_PICKUP",
    "paymentStatus": "PENDING",
    "totalAmount": "475",
    "createdAt": "2026-03-25T10:00:00Z"
  }
}
```

---

#### 2.2 List All Orders (Admin/Staff Only)
```http
GET /api/orders?status=PENDING_PICKUP&limit=10&page=1
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
- `status` (optional): Filter by order status
- `customerId` (optional): Filter by customer
- `limit` (optional): Items per page (default: 50)
- `page` (optional): Page number (default: 1)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "NJ-20260325-547",
        "customerId": "uuid",
        "status": "PENDING_PICKUP",
        "orderType": "B2C",
        "totalAmount": "475",
        "paymentStatus": "PENDING",
        "createdAt": "2026-03-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

#### 2.3 Get Order Details
```http
GET /api/orders/{orderId}
Authorization: Bearer eyJhbGc...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "id": "uuid",
    "orderNumber": "NJ-20260325-547",
    "customerId": "uuid",
    "status": "PENDING_PICKUP",
    "totalAmount": "475",
    "items": [
      {
        "id": "uuid",
        "serviceId": "uuid",
        "quantity": 5,
        "unitPrice": "50",
        "totalPrice": "250"
      }
    ],
    "customer": {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+66812345678",
      "address": "123 Main St"
    }
  }
}
```

---

#### 2.4 Update Order Status (Admin/Staff/Driver)
```http
POST /api/orders/{orderId}/status
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "status": "WASHING",
  "note": "Started washing process"
}
```

**Valid Statuses**:
- `PENDING_PICKUP`
- `WASHING`
- `PACKING`
- `READY_FOR_DELIVERY`
- `COMPLETED`
- `CANCELLED`

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order status updated to WASHING",
  "data": null
}
```

---

### 3. **HEALTH CHECK & INFO**

#### 3.1 Health Check
```http
GET /health
```

**Response (200 OK)**:
```json
{
  "status": "OK",
  "environment": "development",
  "timestamp": "2026-03-25T10:00:00.000Z"
}
```

---

#### 3.2 API Info
```http
GET /api/info
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "name": "NongJames Laundry API",
    "version": "1.0.0",
    "features": [
      "User Authentication with JWT",
      "LINE Official Account Integration",
      "Order Management with Workflow",
      "Real-time Driver Logistics",
      "Financial Dashboard",
      "SCB Payment Integration"
    ]
  }
}
```

---

## 📱 Postman Setup Instructions

### Step 1: Create New Collection
1. Open Postman
2. Click **"Create"** → **"Collection"** → **"Create a new collection"**
3. Name it: `NongJames Laundry API`
4. Click **Create**

---

### Step 2: Add Environment Variables
1. Click **"Environments"** → **"+"** (Create new)
2. Name: `NongJames Dev`
3. Add variables:

```
Variable Name          | Initial Value           | Current Value
-----------           | -----------             | -----------
base_url              | http://localhost:3000   | http://localhost:3000
access_token          | (empty)                 | (empty)
refresh_token         | (empty)                 | (empty)
admin_token           | (empty)                 | (empty)
user_id               | (empty)                 | (empty)
customer_id           | (empty)                 | (empty)
order_id              | (empty)                 | (empty)
```

Click **Save**.

---

### Step 3: Add Pre-request & Test Scripts

#### For Register/Login Requests
In **Tests** tab, add:
```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
  const data = pm.response.json();
  if (data.data.accessToken) {
    pm.environment.set("access_token", data.data.accessToken);
    pm.environment.set("refresh_token", data.data.refreshToken || "");
    pm.environment.set("user_id", data.data.user.id);
  }
}
```

---

### Step 4: Create Requests

#### 4.1 Register Admin User
- **Method**: POST
- **URL**: `{{base_url}}/api/auth/register`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123456",
  "role": "ADMIN"
}
```

---

#### 4.2 Register Customer
- **Method**: POST
- **URL**: `{{base_url}}/api/auth/register`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "name": "John Doe",
  "email": "customer@example.com",
  "password": "customer123",
  "role": "CUSTOMER"
}
```

---

#### 4.3 Login
- **Method**: POST
- **URL**: `{{base_url}}/api/auth/login`
- **Header**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "admin123456"
}
```

---

#### 4.4 Get Profile
- **Method**: GET
- **URL**: `{{base_url}}/api/auth/profile`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`

---

#### 4.5 Create Order
- **Method**: POST
- **URL**: `{{base_url}}/api/orders`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "customerId": "{{customer_id}}",
  "orderType": "B2C",
  "pickupAddress": "123 Main St, Bangkok",
  "deliveryAddress": "456 Oak Ave, Bangkok",
  "items": [
    {
      "serviceId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 5,
      "unitPrice": 50
    }
  ],
  "notes": "Dry clean only"
}
```

**Tests** tab script:
```javascript
if (pm.response.code === 201) {
  const data = pm.response.json();
  pm.environment.set("order_id", data.data.id);
}
```

---

#### 4.6 List Orders
- **Method**: GET
- **URL**: `{{base_url}}/api/orders?status=PENDING_PICKUP&limit=10&page=1`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`

---

#### 4.7 Get Order Details
- **Method**: GET
- **URL**: `{{base_url}}/api/orders/{{order_id}}`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`

---

#### 4.8 Update Order Status
- **Method**: POST
- **URL**: `{{base_url}}/api/orders/{{order_id}}/status`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "status": "WASHING",
  "note": "Started washing"
}
```

---

## 🧪 Testing Workflow

### 1. Health Check
```
1. Send GET /health
2. Verify status = "OK"
```

### 2. User Registration & Authentication
```
1. Register Admin: POST /api/auth/register (ADMIN role)
2. Register Customer: POST /api/auth/register (CUSTOMER role)
3. Copy access_token from response (auto-saved by test script)
4. Get Profile: GET /api/auth/profile (verify identity)
```

### 3. Order Management
```
1. Create Order: POST /api/orders (requires ADMIN role)
2. List Orders: GET /api/orders
3. Get Order Details: GET /api/orders/{order_id}
4. Update Status: POST /api/orders/{order_id}/status
5. Verify status changes in workflow: PENDING_PICKUP → WASHING → PACKING → READY → COMPLETED
```

---

## ❌ Common Issues & Solutions

### Issue 1: "Connection refused" on localhost:3000
**Solution**: Ensure API is running
```bash
bun run dev
# or
npm run dev
```

### Issue 2: "Invalid token" or 401 Unauthorized
**Solution**: 
- Register and login first
- Copy the `accessToken` from the response
- Use `{{access_token}}` in Authorization header
- Check token hasn't expired (7 days)

### Issue 3: "Database connection failed"
**Solution**:
- Verify PostgreSQL is running
- Check `.env` DATABASE_URL is correct
- Run migrations: `bun run drizzle-kit push:pg`

### Issue 4: "Role is not allowed" (403 Forbidden)
**Solution**: 
- Create orders only with ADMIN or STAFF role
- A CUSTOMER role cannot create orders

### Issue 5: "CORS error"
**Solution**:
- Verify CORS_ORIGIN in `.env` includes Postman URL
- Default is `*` (all origins allowed)

---

## 📊 Database Schema Overview

### Users Table
- `id` (UUID): Primary key
- `email` (String): Unique email
- `password` (String): Hashed with bcryptjs
- `fullName` (String): User's full name
- `role` (Enum): ADMIN, STAFF, DRIVER, CUSTOMER
- `phone` (String): Contact number
- `createdAt` (Timestamp): Account creation

### Orders Table
- `id` (UUID): Primary key
- `orderNumber` (String): Format NJ-YYYYMMDD-XXX
- `customerId` (UUID): FK to users
- `status` (Enum): PENDING_PICKUP → WASHING → PACKING → READY_FOR_DELIVERY → COMPLETED
- `totalAmount` (Numeric): Order total price
- `createdAt` (Timestamp): Order creation date

### OrderItems Table
- `id` (UUID): Primary key
- `orderId` (UUID): FK to orders
- `serviceId` (UUID): FK to services
- `quantity` (Integer): Number of items
- `unitPrice` (Numeric): Price per unit
- `totalPrice` (Numeric): Quantity × unitPrice

---

## 🔗 Additional Resources

- **API Documentation**: `http://localhost:3000/docs` (Swagger UI)
- **SRS Document**: `documents/PM.XX/PM.00/SRS-laundry-shop/SRS-002.md`
- **Backend Setup**: `nongJames-api/BACKEND_REBUILD.md`
- **Database Guide**: `nongJames-api/DATABASE_MIGRATION_GUIDE.md`

---

## ✅ Verification Checklist

- [ ] Backend compiles without errors ✅ (Verified)
- [ ] All TypeScript files are valid ✅ (Verified)
- [ ] Route structure includes `/api` prefix ✅ (Verified)
- [ ] Authentication logic is implemented ✅ (Verified)
- [ ] Order management endpoints are set up ✅ (Verified)
- [ ] Database schema is defined ✅ (Verified)
- [ ] Middleware for auth is configured ✅ (Verified)

---

**Project Status**: 🟢 **Ready to Test**  
**Last Updated**: March 25, 2026  
**Backend Version**: 1.0.0

