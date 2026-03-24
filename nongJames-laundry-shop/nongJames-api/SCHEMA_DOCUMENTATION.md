# Drizzle ORM PostgreSQL Schema Documentation

## Overview

This document describes the complete PostgreSQL schema for the NongJames Laundry Management System v2.4, implementing:
- **B2C Customers** via LINE OA and Web Portal
- **B2B Clients** via Corporate Contracts
- **Order Management** with workflow (Pending → Washing → Packing → Ready → Completed)
- **Financial Integration** with SCB Developer API
- **Logistics & Driver Management** with real-time tracking
- **Payment Processing** with multiple methods

---

## Database Tables Structure

### 1. USERS TABLE
**Purpose:** Store all user types (Admin, Staff, Driver, Customer)

```sql
users
├── id (UUID, PK)
├── email (VARCHAR, unique)
├── password (VARCHAR)
├── fullName (VARCHAR)
├── phone (VARCHAR)
├── role (ENUM: ADMIN, STAFF, DRIVER, CUSTOMER)
├── lineUserId (VARCHAR, unique) → B2C LINE integration
├── lineDisplayName (VARCHAR)
├── linePictureUrl (TEXT)
├── address (TEXT)
├── city, postalCode, latitude, longitude
├── membershipLevel (ENUM: STANDARD, VIP)
├── membershipExpiryDate (TIMESTAMP)
├── loyaltyPoints (INTEGER)
├── licenseNumber (VARCHAR) → Driver only
├── isActive (BOOLEAN)
├── createdAt, updatedAt (TIMESTAMP)
```

**Indices:** email, lineUserId, phone, role

---

### 2. ORDERS TABLE & ORDER_ITEMS TABLE
**Purpose:** Main order records and line items

```sql
orders
├── id (UUID, PK)
├── orderNumber (VARCHAR, unique)
├── customerId (UUID, FK → users)
├── driverId (UUID, FK → users)
├── status (ENUM: PENDING, WASHING, PACKING, READY, COMPLETED, CANCELLED)
├── deliveryType (ENUM: WALK_IN, PICKUP, DELIVERY)
├── subtotal, discount, tax, totalAmount (NUMERIC)
├── isRushService (BOOLEAN)
├── isDryClean (BOOLEAN)
├── specialNotes (TEXT)
├── loyaltyPointsEarned (INTEGER)
├── receivedDate (TIMESTAMP)
├── estimatedReadyDate (TIMESTAMP)
├── completedDate (TIMESTAMP)
├── actualDeliveryDate (TIMESTAMP)
└── createdAt, updatedAt (TIMESTAMP)

order_items
├── id (UUID, PK)
├── orderId (UUID, FK → orders)
├── itemType (VARCHAR)
├── quantity (INTEGER)
├── color, size (VARCHAR)
├── hasEmbroidery, hasLogo, hasLace (BOOLEAN)
├── existingDamage (TEXT)
├── specialInstructions (TEXT)
├── itemPhotoUrl (TEXT)
├── unitPrice, totalPrice (NUMERIC)
└── createdAt (TIMESTAMP)
```

**Order Status Workflow:**
```
┌─────────┐    ┌─────────┐    ┌────────┐    ┌───────┐    ┌──────────┐
│ PENDING │ -> │ WASHING │ -> │PACKING │ -> │ READY │ -> │COMPLETED │
└─────────┘    └─────────┘    └────────┘    └───────┘    └──────────┘
      │
      └──> CANCELLED
```

**Indices:** customerId, driverId, status, orderNumber, receivedDate

---

### 3. ORDER_WORKFLOW_HISTORY TABLE
**Purpose:** Audit trail for order status transitions

```sql
order_workflow_history
├── id (UUID, PK)
├── orderId (UUID, FK → orders)
├── fromStatus (VARCHAR)
├── toStatus (VARCHAR)
├── changedBy (UUID, FK → users)
├── reason (TEXT)
├── notes (TEXT)
└── transitionedAt (TIMESTAMP)
```

---

### 4. TRANSACTIONS TABLE
**Purpose:** SCB API integration - store all financial transactions

```sql
transactions
├── id (UUID, PK)
├── scbTransactionId (VARCHAR, unique) → From SCB API
├── scbReferenceNo (VARCHAR) → SCB reference
├── type (ENUM: INCOME, EXPENSE)
├── status (ENUM: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
├── paymentMethod (ENUM: SCB_QR, SCB_TRANSFER, CREDIT_CARD, CASH, BANK_TRANSFER)
├── amount (NUMERIC)
├── currency (VARCHAR, default: THB)
├── orderId (UUID, FK → orders)
├── userId (UUID, FK → users)
├── description (TEXT)
├── category (VARCHAR)
├── scbMerchantId (VARCHAR)
├── scbChannelId (VARCHAR)
├── scbInvoiceNo (VARCHAR)
├── scbTerminalId (VARCHAR)
├── scbRawResponse (TEXT) → Full SCB API response
├── proofOfPaymentUrl (TEXT)
├── receiptNumber (VARCHAR)
├── invoiceNumber (VARCHAR)
├── isReconciled (BOOLEAN)
├── reconciledAt (TIMESTAMP)
├── reconciledBy (UUID, FK → users)
├── transactionDate (TIMESTAMP)
├── processedDate (TIMESTAMP)
└── createdAt, updatedAt (TIMESTAMP)
```

**Indices:** scbTransactionId, orderId, userId, type, status, transactionDate

---

### 5. TRANSACTION_LOGS TABLE
**Purpose:** Audit trail for transaction status changes

```sql
transaction_logs
├── id (UUID, PK)
├── transactionId (UUID, FK → transactions)
├── fromStatus (VARCHAR)
├── toStatus (VARCHAR)
├── reason (TEXT)
├── changedBy (UUID, FK → users)
└── createdAt (TIMESTAMP)
```

---

### 6. CONTRACTS TABLE & RELATED TABLES
**Purpose:** B2B client contracts and terms

```sql
contracts
├── id (UUID, PK)
├── contractNumber (VARCHAR, unique)
├── contractType (ENUM: SERVICE_AGREEMENT, MONTHLY_SUBSCRIPTION, ANNUAL_MEMBERSHIP, CORPORATE_ACCOUNT)
├── clientId (UUID, FK → users)
├── clientName (VARCHAR)
├── taxId (VARCHAR) → Business tax ID
├── businessRegistration (VARCHAR)
├── contactPerson (VARCHAR)
├── contactEmail, contactPhone (VARCHAR)
├── billingAddress, billingCity, billingPostalCode (TEXT/VARCHAR)
├── deliveryAddress, deliveryCity, deliveryPostalCode (TEXT/VARCHAR)
├── deliveryLatitude, deliveryLongitude (NUMERIC)
├── status (ENUM: DRAFT, PENDING_APPROVAL, ACTIVE, SUSPENDED, EXPIRED, TERMINATED)
├── startDate, endDate (DATE)
├── autoRenewal (BOOLEAN)
├── renewalNoticeDays (INTEGER)
├── monthlyBasePrice, annualBasePrice (NUMERIC)
├── discountPercentage (NUMERIC)
├── discountNotes (TEXT)
├── includedServices (TEXT) → JSON or comma-separated
├── maxMonthlyOrders, averageMonthlyOrders (INTEGER)
├── priorityPickupDelivery, dedicatedDriver (BOOLEAN)
├── preferredDriver (UUID, FK → users)
├── paymentTerms (VARCHAR)
├── paymentMethod (VARCHAR)
├── creditLimit, currentBalance (NUMERIC)
├── contractDocument (TEXT) → PDF URL
├── specialConditions (TEXT)
├── accountManager (UUID, FK → users)
├── isActive (BOOLEAN)
├── suspensionReason, terminationReason (TEXT)
└── createdAt, updatedAt (TIMESTAMP)

contract_line_items
├── id (UUID, PK)
├── contractId (UUID, FK → contracts)
├── serviceName (VARCHAR)
├── serviceDescription (TEXT)
├── quantity (INTEGER)
├── unitPrice (NUMERIC)
├── discount (NUMERIC)
├── totalPrice (NUMERIC)
├── isActive (BOOLEAN)
└── createdAt (TIMESTAMP)

contract_history
├── id (UUID, PK)
├── contractId (UUID, FK → contracts)
├── changeType (VARCHAR)
├── fromValue, toValue (TEXT)
├── reason (TEXT)
├── changedBy (UUID, FK → users)
└── createdAt (TIMESTAMP)
```

**Indices:** clientId, contractNumber, status, startDate, endDate

---

### 7. LOGISTICS TABLES
**Purpose:** Driver management, delivery assignments, and tracking

```sql
drivers
├── id (UUID, PK)
├── userId (UUID, unique, FK → users)
├── licenseNumber (VARCHAR, unique)
├── licenseExpiry (DATE)
├── licensePhotoUrl (TEXT)
├── vehicleType (VARCHAR)
├── vehiclePlate (VARCHAR, unique)
├── registrationNumber (VARCHAR, unique)
├── vehicleInsurance (VARCHAR)
├── vehicleInsuranceExpiry (DATE)
├── isActive, isAvailable (BOOLEAN)
├── availableSince (TIMESTAMP)
├── averageRating (NUMERIC)
├── totalDeliveries (INTEGER)
├── successRate (NUMERIC)
├── emergencyContact (VARCHAR)
├── bankAccount (VARCHAR)
└── bankName (VARCHAR)

delivery_assignments
├── id (UUID, PK)
├── orderId (UUID, FK → orders)
├── driverId (UUID, FK → drivers)
├── assignmentType (VARCHAR)
├── status (ENUM: ASSIGNED, ON_WAY_PICKUP, ARRIVED_PICKUP, PICKED_UP, etc.)
├── priority (INTEGER)
├── estimatedPickupTime, estimatedDeliveryTime (TIMESTAMP)
├── actualPickupTime, actualDeliveryTime (TIMESTAMP)
├── pickupAddress, pickupLatitude, pickupLongitude (TEXT/NUMERIC)
├── pickupPhotos, pickupSignature (TEXT) → URLs and base64
├── pickupNotes (TEXT)
├── deliveryAddress, deliveryLatitude, deliveryLongitude (TEXT/NUMERIC)
├── deliveryPhotos, deliverySignature (TEXT)
├── deliveryNotes (TEXT)
├── customerName, customerPhone (VARCHAR)
├── failureReason (TEXT)
├── failureAttempts (INTEGER)
├── estimatedDistance, actualDistance (NUMERIC)
├── estimatedDuration, actualDuration (INTEGER)
└── createdAt, updatedAt (TIMESTAMP)

driver_location_history
├── id (UUID, PK)
├── driverId (UUID, FK → drivers)
├── assignmentId (UUID, FK → delivery_assignments)
├── latitude, longitude (NUMERIC)
├── accuracy, speed, heading (NUMERIC)
└── recordedAt (TIMESTAMP)
```

**Delivery Status Workflow:**
```
ASSIGNED → ON_WAY_PICKUP → ARRIVED_PICKUP → PICKED_UP → 
ON_WAY_DELIVERY → ARRIVED_DELIVERY → COMPLETED
         ↓
       FAILED → (retry or cancel)
```

**Indices:** userId (drivers), orderId, driverId, status, recordedAt

---

### 8. PAYMENTS TABLE
**Purpose:** Track payments for orders

```sql
payments
├── id (UUID, PK)
├── paymentNumber (VARCHAR, unique)
├── orderId (UUID, FK → orders)
├── amount (NUMERIC)
├── paymentMethod (ENUM: SCB_QR, SCB_TRANSFER, CREDIT_CARD, CASH, etc.)
├── status (ENUM: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED)
├── scbTransactionId (VARCHAR, unique)
├── scbReferenceNo (VARCHAR)
├── scbQrCode (TEXT) → Base64 encoded
├── scbPaymentUrl (TEXT)
├── proofOfPaymentUrl (TEXT)
├── transactionHash (VARCHAR)
├── initiatedAt, completedAt, expiryDate (TIMESTAMP)
├── notes, failureReason (TEXT)
├── isRefunded (BOOLEAN)
├── refundAmount, refundDate, refundReason (NUMERIC/TIMESTAMP/TEXT)
└── createdAt, updatedAt (TIMESTAMP)

payment_logs
├── id (UUID, PK)
├── paymentId (UUID, FK → payments)
├── fromStatus, toStatus (VARCHAR)
├── reason (TEXT)
├── changedBy (UUID, FK → users)
└── createdAt (TIMESTAMP)
```

**Indices:** orderId, scbTransactionId, status, paymentMethod

---

### 9. FINANCE TABLES
**Purpose:** Invoicing, financial reports, and ledger

```sql
invoices
├── id (UUID, PK)
├── invoiceNumber (VARCHAR, unique)
├── orderId (UUID, FK → orders)
├── invoiceDate, dueDate, paidDate (DATE)
├── subtotal, discount, tax (NUMERIC)
├── totalAmount, paidAmount, remainingAmount (NUMERIC)
├── status (ENUM: DRAFT, ISSUED, SENT, PAID, OVERDUE, CANCELLED, REFUNDED)
├── invoiceDocumentUrl (TEXT)
├── notes (TEXT)
├── paymentTerms (VARCHAR)
└── createdAt, updatedAt (TIMESTAMP)

financial_reports
├── id (UUID, PK)
├── reportDate (DATE)
├── reportType (VARCHAR: DAILY, WEEKLY, MONTHLY, YEARLY)
├── totalIncome, orderCount, averageOrderValue (NUMERIC/INTEGER)
├── totalExpenses (NUMERIC)
├── totalProfit, profitMargin (NUMERIC)
├── cashPayments, scbPayments, transferPayments (NUMERIC)
├── totalRefunds (NUMERIC)
├── notes (TEXT)
└── createdAt, updatedAt (TIMESTAMP)

account_ledger
├── id (UUID, PK)
├── transactionDate (DATE)
├── description (TEXT)
├── referenceId (VARCHAR)
├── accountCode, accountName (VARCHAR)
├── debit, credit, balance (NUMERIC)
├── category (VARCHAR: REVENUE, EXPENSE, ASSET, LIABILITY)
├── notes (TEXT)
└── createdAt (TIMESTAMP)
```

---

### 10. SERVICES CATALOG
**Purpose:** Define available laundry services and pricing

```sql
services
├── id (UUID, PK)
├── name (VARCHAR)
├── description (TEXT)
├── category (ENUM: WASH, DRY_CLEAN, SPECIAL_CARE, RUSH_SERVICE, ADDITIONAL_SERVICE)
├── basePrice, pricePerKg, pricePerItem (NUMERIC)
├── applicableItemTypes (TEXT) → JSON array
├── estimatedDays (INTEGER)
├── isRushAvailable (BOOLEAN)
├── rushPrice (NUMERIC)
├── icon, color (VARCHAR)
├── isActive (BOOLEAN)
├── displayOrder (INTEGER)
└── createdAt, updatedAt (TIMESTAMP)

service_pricing_rules
├── id (UUID, PK)
├── serviceId (UUID, FK → services)
├── ruleType (VARCHAR: VOLUME, MEMBERSHIP, BULK, PROMOTION)
├── minQuantity, maxQuantity (INTEGER)
├── applicableMembership (VARCHAR)
├── discountType (VARCHAR: PERCENTAGE, FIXED)
├── discountValue (NUMERIC)
├── validFrom, validUntil (TIMESTAMP)
├── isActive (BOOLEAN)
└── createdAt (TIMESTAMP)
```

---

### 11. NOTIFICATIONS TABLES
**Purpose:** Notification management for LINE OA and other channels

```sql
notifications
├── id (UUID, PK)
├── userId (UUID, FK → users)
├── type (ENUM: ORDER_CREATED, ORDER_STATUS_UPDATED, PAYMENT_REQUIRED, etc.)
├── channel (ENUM: LINE_OA, EMAIL, SMS, WEB_PUSH, IN_APP)
├── title (VARCHAR)
├── message (TEXT)
├── imageUrl (TEXT)
├── orderId (UUID, FK → orders)
├── relatedId (VARCHAR)
├── actionUrl (TEXT)
├── isRead, isSent (BOOLEAN)
├── readAt, sentAt, deliveredAt (TIMESTAMP)
├── failureReason (TEXT)
├── lineMessageId (VARCHAR)
└── createdAt (TIMESTAMP)

line_users
├── id (UUID, PK)
├── userId (UUID, unique, FK → users)
├── lineUserId (VARCHAR, unique)
├── displayName (VARCHAR)
├── pictureUrl (TEXT)
├── statusMessage (TEXT)
├── isFriend (BOOLEAN)
├── friendSince (TIMESTAMP)
├── notificationsEnabled (BOOLEAN)
├── language (VARCHAR, default: th)
├── subscriptionStatus (VARCHAR)
├── lastInteraction (TIMESTAMP)
└── createdAt, updatedAt (TIMESTAMP)

notification_templates
├── id (UUID, PK)
├── name (VARCHAR, unique)
├── type (ENUM: notification types)
├── channel (ENUM: notification channels)
├── title (VARCHAR)
├── messageTemplate (TEXT) → {{placeholder}} format
├── variablesUsed (TEXT) → JSON array
├── isActive (BOOLEAN)
└── createdAt (TIMESTAMP)
```

---

## Relationships Summary

```
users (1) ──────────────────────────── (N) orders
  │
  ├─ (1) ──────────────────────────── (N) contracts (as client)
  │
  ├─ (1) ──────────────────────────── (1) drivers
  │
  ├─ (1) ──────────────────────────── (N) transactions
  │
  └─ (1) ──────────────────────────── (N) notifications

orders (1) ────────────────────── (N) order_items
  │
  ├─ (1) ────────────────────── (N) order_workflow_history
  │
  ├─ (1) ────────────────────── (N) delivery_assignments
  │
  ├─ (1) ────────────────────── (N) payments
  │
  ├─ (1) ────────────────────── (1) invoices
  │
  └─ (1) ────────────────────── (N) transactions

contracts (1) ────────────────────── (N) contract_line_items
  │
  └─ (1) ────────────────────── (N) contract_history

drivers (1) ────────────────────── (N) delivery_assignments
  │
  └─ (1) ────────────────────── (N) driver_location_history

services (1) ────────────────────── (N) service_pricing_rules
```

---

## Indexes Performance

**High-frequency queries have dedicated indices:**

```
Users: email, lineUserId, phone, role
Orders: customerId, driverId, status, orderNumber, receivedDate
Transactions: scbTransactionId, orderId, userId, type, status, transactionDate
Contracts: clientId, contractNumber, status, startDate, endDate
Payments: orderId, scbTransactionId, status, paymentMethod
Logistics: driverId, assignmentId, recordedAt
Financial: reportDate, reportType
Notifications: userId, orderId, type, isRead
```

---

## SCB API Integration Fields

**Transactions table specifically supports SCB Developer API:**

- `scbTransactionId` - Unique transaction ID from SCB
- `scbReferenceNo` - SCB reference number
- `scbMerchantId` - Merchant ID assigned by SCB
- `scbChannelId` - Channel ID from SCB
- `scbInvoiceNo` - Invoice number from SCB
- `scbTerminalId` - Terminal ID for transaction
- `scbRawResponse` - Full API response for audit purposes
- `scbQrCode` - Generated QR code for payments
- `scbPaymentUrl` - Unique payment URL from SCB

---

## B2C LINE OA Integration

**LINE user connection through:**

1. `users.lineUserId` - LINE user ID
2. `users.lineDisplayName` - LINE display name
3. `users.linePictureUrl` - LINE profile picture
4. `line_users` table - Extended LINE user metadata
5. `notifications` with `channel: LINE_OA` - Send notifications
6. `notification_templates` - Define LINE message templates

---

## Setup Instructions

### 1. Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/laundry_db
```

### 2. Drizzle Configuration

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    prefix: 'timestamp',
  },
});
```

### 3. Generate & Run Migrations

```bash
# Generate migration files
bun drizzle-kit generate:pg

# Apply migrations
bun drizzle-kit migrate

# Push schema (for development)
bun drizzle-kit push:pg
```

---

## Data Types Reference

| Type | Usage |
|------|-------|
| `UUID` | Primary and foreign keys |
| `VARCHAR` | Short strings (name, phone, email) |
| `TEXT` | Long text (descriptions, notes, JSON) |
| `NUMERIC(12,2)` | Money amounts (precise to 2 decimals) |
| `BOOLEAN` | Flags (isActive, isRushService) |
| `TIMESTAMP with timezone` | Event tracking and auditing |
| `DATE` | Contract dates, invoice dates |
| `INTEGER` | Counts (quantity, loyalty points) |
| `ENUM` | Status and type fields |

---

## Performance Optimization

- All **foreign keys** use UUID for consistency
- All **status** fields are indexed for quick filtering
- Timestamp fields use UTC timezone
- JSON fields in TEXT allow flexible data storage
- Location fields (latitude/longitude) use NUMERIC(10,8) / NUMERIC(11,8)
- Financial amounts use NUMERIC(12,2) for precision

---

**Last Updated:** March 24, 2026  
**Schema Version:** 2.4  
**Database:** PostgreSQL 13+
