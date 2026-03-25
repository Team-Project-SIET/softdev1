# NongJames Laundry System - Quick Reference Guide

## Quick Database Queries by Feature

### 1. ORDER MANAGEMENT

#### Create New Order
```typescript
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { NewOrder } from '@/db/schema/types';

async function createOrder(customerId: string, orderData: {
  items: Array<{ itemType: string; quantity: number; unitPrice: number }>;
  totalAmount: number;
  deliveryType: 'WALK_IN' | 'PICKUP' | 'DELIVERY';
}) {
  const orderNumber = `ORD-${Date.now()}`;
  
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerId,
        orderNumber,
        totalAmount: orderData.totalAmount,
        deliveryType: orderData.deliveryType,
        status: 'PENDING',
        receivedDate: new Date(),
        estimatedReadyDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      })
      .returning();

    await tx.insert(orderItems).values(
      orderData.items.map(item => ({
        orderId: order.id,
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }))
    );

    return order;
  });
}
```

#### Get Order with Customer & Driver Info
```typescript
async function getOrderDetails(orderId: string) {
  return await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      customerName: users.fullName,
      customerEmail: users.email,
      customerPhone: users.phone,
      driverName: users.fullName,
      driverPhone: users.phone,
      receivedDate: orders.receivedDate,
      estimatedReadyDate: orders.estimatedReadyDate,
    })
    .from(orders)
    .innerJoin(users, eq(orders.customerId, users.id))
    .leftJoin(users, eq(orders.driverId, users.id))
    .where(eq(orders.id, orderId));
}
```

#### Update Order Status (with History)
```typescript
async function updateOrderStatus(
  orderId: string, 
  newStatus: string, 
  changedByUserId: string, 
  reason?: string
) {
  return await db.transaction(async (tx) => {
    // Get current status
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    // Update order
    await tx
      .update(orders)
      .set({ 
        status: newStatus,
        completedDate: newStatus === 'COMPLETED' ? new Date() : order.completedDate,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Log change
    await tx.insert(orderWorkflowHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: newStatus,
      changedBy: changedByUserId,
      reason: reason || `Status changed to ${newStatus}`,
      transitionedAt: new Date(),
    });
  });
}
```

#### Get Pending Orders (Status not completed)
```typescript
async function getPendingOrders(limit = 20) {
  return await db
    .select()
    .from(orders)
    .where(
      and(
        ne(orders.status, 'COMPLETED'),
        ne(orders.status, 'CANCELLED')
      )
    )
    .orderBy(desc(orders.receivedDate))
    .limit(limit);
}
```

---

### 2. CUSTOMER MANAGEMENT (B2C)

#### Register New Customer
```typescript
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function registerCustomer(email: string, password: string, fullName: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const [customer] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      fullName,
      role: 'CUSTOMER',
      membershipLevel: 'STANDARD',
      loyaltyPoints: 0,
      isActive: true,
    })
    .returning();

  return customer;
}
```

#### Link LINE User to Customer
```typescript
async function linkLineUser(
  customerId: string, 
  lineUserId: string, 
  lineDisplayName: string,
  linePictureUrl: string
) {
  const [customer] = await db
    .update(users)
    .set({
      lineUserId,
      lineDisplayName,
      linePictureUrl,
    })
    .where(eq(users.id, customerId))
    .returning();

  // Also create entry in lineUsers table
  await db
    .insert(lineUsers)
    .values({
      userId: customerId,
      lineUserId,
      displayName: lineDisplayName,
      pictureUrl: linePictureUrl,
      isFriend: true,
      friendSince: new Date(),
      notificationsEnabled: true,
    });

  return customer;
}
```

#### Get Customer Order History
```typescript
async function getCustomerOrderHistory(customerId: string, limit = 20) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.receivedDate))
    .limit(limit);
}
```

#### Add Loyalty Points to Customer
```typescript
async function addLoyaltyPoints(customerId: string, points: number, reason: string) {
  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.id, customerId));

  return await db
    .update(users)
    .set({
      loyaltyPoints: customer.loyaltyPoints + points,
      updatedAt: new Date(),
    })
    .where(eq(users.id, customerId))
    .returning();
}
```

---

### 3. PAYMENT PROCESSING (SCB Integration)

#### Create Payment Record
```typescript
import { payments } from '@/db/schema';

async function createPayment(
  orderId: string,
  paymentData: {
    amount: number;
    paymentMethod: 'SCB_QR' | 'SCB_TRANSFER' | 'CREDIT_CARD' | 'CASH';
    scbQrCode?: string;
  }
) {
  const [payment] = await db
    .insert(payments)
    .values({
      paymentNumber: `PAY-${Date.now()}`,
      orderId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      status: 'PENDING',
      scbQrCode: paymentData.scbQrCode,
      initiatedAt: new Date(),
      expiryDate: new Date(Date.now() + 15 * 60 * 1000), // 15 min for QR
    })
    .returning();

  return payment;
}
```

#### Verify SCB Payment & Update Database
```typescript
async function verifyAndUpdatePayment(
  paymentId: string,
  scbTransactionId: string,
  scbVerified: boolean,
  scbRawResponse: any
) {
  return await db.transaction(async (tx) => {
    // Update payment
    const [payment] = await tx
      .update(payments)
      .set({
        status: scbVerified ? 'COMPLETED' : 'FAILED',
        scbTransactionId,
        completedAt: scbVerified ? new Date() : null,
        failureReason: !scbVerified ? 'SCB verification failed' : null,
      })
      .where(eq(payments.id, paymentId))
      .returning();

    if (scbVerified) {
      // Log payment event
      await tx.insert(paymentLogs).values({
        paymentId,
        fromStatus: 'PENDING',
        toStatus: 'COMPLETED',
        reason: `SCB payment verified - Ref: ${scbTransactionId}`,
      });

      // Create transaction record for finance
      await tx.insert(transactions).values({
        scbTransactionId,
        scbReferenceNo: scbRawResponse.referenceNo,
        scbRawResponse: JSON.stringify(scbRawResponse),
        type: 'INCOME',
        status: 'COMPLETED',
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        orderId: payment.orderId,
        transactionDate: new Date(),
        processedDate: new Date(),
      });

      // Update order status if paid
      const orderData = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, payment.orderId));
      
      if (orderData[0].status === 'PENDING') {
        await tx
          .update(orders)
          .set({ status: 'WASHING' })
          .where(eq(orders.id, payment.orderId));
      }
    }

    return payment;
  });
}
```

#### Get Payment Status
```typescript
async function getPaymentStatus(paymentId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId));

  return payment?.status || null;
}
```

---

### 4. DRIVER & LOGISTICS

#### Register Driver
```typescript
import { drivers } from '@/db/schema';

async function registerDriver(driverData: {
  userId: string;
  licenseNumber: string;
  licenseExpiry: Date;
  vehicleType: string;
  vehiclePlate: string;
  registrationNumber: string;
  bankAccount: string;
  bankName: string;
}) {
  const [driver] = await db
    .insert(drivers)
    .values({
      ...driverData,
      isActive: true,
      isAvailable: true,
      totalDeliveries: 0,
      averageRating: 0,
      successRate: 0,
    })
    .returning();

  return driver;
}
```

#### Assign Order to Driver
```typescript
import { deliveryAssignments } from '@/db/schema';

async function assignOrderToDriver(
  orderId: string,
  driverId: string,
  assignmentType: 'PICKUP' | 'DELIVERY' | 'BOTH'
) {
  // Update order with driver
  await db
    .update(orders)
    .set({ driverId })
    .where(eq(orders.id, orderId));

  // Create delivery assignment
  const [assignment] = await db
    .insert(deliveryAssignments)
    .values({
      orderId,
      driverId,
      assignmentType,
      status: 'ASSIGNED',
      priority: 1,
    })
    .returning();

  return assignment;
}
```

#### Update Delivery Status
```typescript
async function updateDeliveryStatus(
  assignmentId: string,
  newStatus: string,
  location?: { latitude: number; longitude: number }
) {
  return await db.transaction(async (tx) => {
    // Update assignment
    await tx
      .update(deliveryAssignments)
      .set({
        status: newStatus,
        actualDeliveryTime: 
          newStatus === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(deliveryAssignments.id, assignmentId));

    // Record location if provided
    if (location) {
      const [assignment] = await tx
        .select()
        .from(deliveryAssignments)
        .where(eq(deliveryAssignments.id, assignmentId));

      await tx.insert(driverLocationHistory).values({
        driverId: assignment.driverId,
        assignmentId,
        latitude: location.latitude,
        longitude: location.longitude,
        recordedAt: new Date(),
      });
    }

    return true;
  });
}
```

#### Get Available Drivers
```typescript
async function getAvailableDrivers() {
  return await db
    .select({
      driverId: drivers.id,
      userId: drivers.userId,
      driverName: users.fullName,
      isAvailable: drivers.isAvailable,
      rating: drivers.averageRating,
      successRate: drivers.successRate,
    })
    .from(drivers)
    .innerJoin(users, eq(drivers.userId, users.id))
    .where(eq(drivers.isAvailable, true));
}
```

---

### 5. FINANCIAL REPORTING

#### Record Income Transaction
```typescript
async function recordTransaction(
  orderId: string,
  userId: string,
  scbData?: {
    transactionId: string;
    referenceNo: string;
    rawResponse: any;
  }
) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const [transaction] = await db
    .insert(transactions)
    .values({
      scbTransactionId: scbData?.transactionId,
      scbReferenceNo: scbData?.referenceNo,
      scbRawResponse: scbData ? JSON.stringify(scbData.rawResponse) : null,
      type: 'INCOME',
      status: 'COMPLETED',
      amount: order.totalAmount,
      orderId,
      userId,
      transactionDate: new Date(),
      processedDate: new Date(),
    })
    .returning();

  return transaction;
}
```

#### Generate Daily Financial Report
```typescript
async function generateDailyReport(reportDate: Date) {
  const startDate = new Date(reportDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(reportDate);
  endDate.setHours(23, 59, 59, 999);

  const [{ totalIncome, orderCount, avgValue }] = await db
    .select({
      totalIncome: sum(orders.totalAmount),
      orderCount: count(),
      avgValue: avg(orders.totalAmount),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'COMPLETED'),
        gte(orders.completedDate, startDate),
        lte(orders.completedDate, endDate)
      )
    );

  const [paymentBreakdown] = await db
    .select({
      scbPayments: sum(sql`CASE WHEN ${payments.paymentMethod} LIKE 'SCB%' THEN ${payments.amount} ELSE 0 END`),
      cashPayments: sum(sql`CASE WHEN ${payments.paymentMethod} = 'CASH' THEN ${payments.amount} ELSE 0 END`),
      transferPayments: sum(sql`CASE WHEN ${payments.paymentMethod} = 'BANK_TRANSFER' THEN ${payments.amount} ELSE 0 END`),
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'COMPLETED'),
        gte(payments.completedAt, startDate),
        lte(payments.completedAt, endDate)
      )
    );

  return await db
    .insert(financialReports)
    .values({
      reportDate,
      reportType: 'DAILY',
      totalIncome: totalIncome || 0,
      orderCount: orderCount || 0,
      averageOrderValue: avgValue || 0,
      totalExpenses: 0, // Calculate from transactions later
      totalProfit: totalIncome || 0,
      profitMargin: 0, // Calculate from revenue/profit
      cashPayments: paymentBreakdown?.cashPayments || 0,
      scbPayments: paymentBreakdown?.scbPayments || 0,
      transferPayments: paymentBreakdown?.transferPayments || 0,
    })
    .returning();
}
```

#### Get Monthly Revenue
```typescript
async function getMonthlyRevenue(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [report] = await db
    .select({
      totalRevenue: sum(orders.totalAmount),
      completedOrders: count(),
      averageOrder: avg(orders.totalAmount),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'COMPLETED'),
        gte(orders.completedDate, startDate),
        lte(orders.completedDate, endDate)
      )
    );

  return report;
}
```

---

### 6. NOTIFICATIONS (LINE OA)

#### Send Order Status Update via LINE
```typescript
import { lineClient } from '@/integrations/line';

async function sendOrderStatusNotification(
  orderId: string,
  newStatus: string
) {
  // Get order and customer
  const [order] = await db
    .select()
    .from(orders)
    .innerJoin(users, eq(orders.customerId, users.id))
    .where(eq(orders.id, orderId));

  const customer = order.users;

  if (!customer.lineUserId) {
    console.log('Customer not linked to LINE');
    return;
  }

  // Create notification record
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: customer.id,
      type: 'ORDER_STATUS_UPDATED',
      channel: 'LINE_OA',
      title: `Your order ${order.orders.orderNumber} status update`,
      message: `Status changed to: ${newStatus}`,
      orderId,
      isRead: false,
      isSent: false,
    })
    .returning();

  // Send via LINE
  try {
    const lineMessage = await lineClient.pushMessage(customer.lineUserId, {
      type: 'text',
      text: `📦 Order ${order.orders.orderNumber}\nStatus: ${newStatus}`,
    });

    // Update notification as sent
    await db
      .update(notifications)
      .set({
        isSent: true,
        sentAt: new Date(),
        lineMessageId: lineMessage.messageId,
      })
      .where(eq(notifications.id, notification.id));
  } catch (error) {
    console.error('Failed to send LINE notification:', error);
  }
}
```

#### Get Notification Templates
```typescript
async function getNotificationTemplate(type: string, channel: string) {
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.type, type),
        eq(notificationTemplates.channel, channel)
      )
    );

  return template;
}
```

---

### 7. B2B CONTRACT MANAGEMENT

#### Create Contract
```typescript
import { contracts } from '@/db/schema';

async function createContract(contractData: {
  clientId: string;
  contractType: string;
  monthlyBasePrice: number;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  accountManager: string;
}) {
  const [contract] = await db
    .insert(contracts)
    .values({
      contractNumber: `CON-${Date.now()}`,
      ...contractData,
      status: 'PENDING_APPROVAL',
      autoRenewal: true,
      isActive: false,
    })
    .returning();

  return contract;
}
```

#### Approve Contract
```typescript
async function approveContract(contractId: string, approvedBy: string) {
  return await db.transaction(async (tx) => {
    // Update contract
    await tx
      .update(contracts)
      .set({
        status: 'ACTIVE',
        isActive: true,
      })
      .where(eq(contracts.id, contractId));

    // Log change
    await tx.insert(contractHistory).values({
      contractId,
      changeType: 'STATUS_CHANGED',
      fromValue: 'PENDING_APPROVAL',
      toValue: 'ACTIVE',
      changedBy: approvedBy,
    });
  });
}
```

#### Get Active Contracts
```typescript
async function getActiveContracts() {
  return await db
    .select()
    .from(contracts)
    .where(eq(contracts.status, 'ACTIVE'))
    .orderBy(desc(contracts.startDate));
}
```

---

## Common Error Scenarios

### Scenario 1: Order Already Has Payment

```typescript
async function processPaymentForOrder(orderId: string, paymentData: any) {
  try {
    // Check if order already has completed payment
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.orderId, orderId),
          eq(payments.status, 'COMPLETED')
        )
      );

    if (existingPayment) {
      throw new Error('Order already has a completed payment');
    }

    // Process new payment
    return createPayment(orderId, paymentData);
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
}
```

### Scenario 2: Driver Not Available

```typescript
async function assignmentWithFallback(orderId: string, preferredDriverId?: string) {
  let driver;

  if (preferredDriverId) {
    const available = await db
      .select()
      .from(drivers)
      .where(and(
        eq(drivers.id, preferredDriverId),
        eq(drivers.isAvailable, true)
      ));

    driver = available[0];
  }

  if (!driver) {
    // Get best available driver
    const [bestDriver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.isAvailable, true))
      .orderBy(desc(drivers.averageRating))
      .limit(1);

    driver = bestDriver;
  }

  if (!driver) {
    throw new Error('No available drivers');
  }

  return assignOrderToDriver(orderId, driver.id, 'BOTH');
}
```

---

## Environment Variables Summary

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/laundry_db

# SCB Payment API
SCB_MERCHANT_ID=merchant_123
SCB_API_KEY=key_xxx
SCB_SECRET_KEY=secret_xxx
SCB_API_URL=https://api-sandbox.scb.or.th
SCB_CHANNEL_ID=channel_123

# LINE OA
LINE_CHANNEL_ID=line_channel_123
LINE_CHANNEL_SECRET=line_secret_xxx
LINE_ACCESS_TOKEN=line_token_xxx

# JWT
JWT_SECRET=jwt_secret_xxx
JWT_EXPIRY=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

# Server
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
```

---

## Testing Sample Data

```typescript
// Add to src/db/seeds.ts
async function seedTestData() {
  // Create test admin
  await db.insert(users).values({
    email: 'admin@test.local',
    password: await bcrypt.hash('admin123', 10),
    fullName: 'Admin User',
    role: 'ADMIN',
    isActive: true,
  });

  // Create test customers
  const customer1 = await db.insert(users).values({
    email: 'customer1@test.local',
    fullName: 'John Customer',
    phone: '0812345678',
    role: 'CUSTOMER',
    membershipLevel: 'STANDARD',
    isActive: true,
  }).returning();

  // Create test driver
  const driver = await db.insert(users).values({
    email: 'driver@test.local',
    fullName: 'Sam Driver',
    phone: '0898765432',
    role: 'DRIVER',
    isActive: true,
  }).returning();

  // Create test order
  await db.insert(orders).values({
    customerId: customer1[0].id,
    orderNumber: 'TEST-001',
    totalAmount: 500,
    status: 'PENDING',
    deliveryType: 'PICKUP',
    receivedDate: new Date(),
  });
}

// Run: bun src /db/seeds.ts
```

---

**Last Updated:** March 24, 2026  
**System Version:** v2.4  
**Reviewed for:** ElysiaJS + Bun + Drizzle ORM + PostgreSQL
