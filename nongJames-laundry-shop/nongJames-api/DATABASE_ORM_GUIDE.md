# Database Connection & ORM Usage Guide

## Database Connection Setup

### 1. Configure Database Connection

Update `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create PostgreSQL client
const queryClient = postgres({
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 20, // Connection pool size
  idle_timeout: 30,
  connect_timeout: 10,
});

// Initialize Drizzle ORM
export const db = drizzle(queryClient, { schema });

// Export types for use in services
export type Database = typeof db;

// Health check function
export async function checkDatabaseConnection() {
  try {
    const result = await db.execute('SELECT 1');
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

export default db;
```

### 2. Initialize Database on Application Startup

Update `src/index.ts`:

```typescript
import Elysia from 'elysia';
import { checkDatabaseConnection } from './db';

const app = new Elysia();

// Database initialization
app.before(async () => {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    throw new Error('Database connection failed');
  }
  console.log('Application starting with database connected');
});

// Routes
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

app.listen(process.env.PORT || 3001);
console.log('Server running on port', process.env.PORT || 3001);
```

---

## Basic Query Operations

### SELECT Queries

#### 1. **Get All Records**

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';

// Get all users
const allUsers = await db.select().from(users);

// Get specific columns
const emails = await db
  .select({ id: users.id, email: users.email })
  .from(users);
```

#### 2. **Get Single Record**

```typescript
// Get user by ID
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

// Get by email
const userByEmail = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);
```

#### 3. **Array of Records**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get all orders for a customer
const customerOrders = await db
  .select()
  .from(orders)
  .where(eq(orders.customerId, customerId));
```

#### 4. **Filtered Queries**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

// Multiple conditions (AND)
const orders = await db
  .select()
  .from(orders)
  .where(
    and(
      eq(orders.status, 'WASHING'),
      gt(orders.totalAmount, 1000)
    )
  );

// OR conditions
const filtered = await db
  .select()
  .from(orders)
  .where(
    or(
      eq(orders.status, 'PENDING'),
      eq(orders.status, 'WASHING')
    )
  );

// IN array
const specificOrders = await db
  .select()
  .from(orders)
  .where(inArray(orders.id, [id1, id2, id3]));
```

### INSERT Operations

#### 1. **Insert Single Record**

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';

const newUser = await db
  .insert(users)
  .values({
    email: 'newuser@example.com',
    password: hashedPassword,
    fullName: 'John Doe',
    role: 'CUSTOMER',
    isActive: true,
  })
  .returning();

// newUser contains the inserted record with ID
console.log('New user ID:', newUser[0].id);
```

#### 2. **Insert Multiple Records**

```typescript
const newOrders = await db
  .insert(orders)
  .values([
    { customerId: id1, totalAmount: 500, status: 'PENDING' },
    { customerId: id2, totalAmount: 750, status: 'PENDING' },
  ])
  .returning();
```

#### 3. **Insert with Relations**

```typescript
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';

// Create order with items (using transactions)
await db.transaction(async (tx) => {
  const [order] = await tx
    .insert(orders)
    .values({
      customerId: customerId,
      orderNumber: generateOrderNumber(),
      totalAmount: 1500,
      status: 'PENDING',
    })
    .returning();

  await tx
    .insert(orderItems)
    .values([
      {
        orderId: order.id,
        itemType: 'Shirt',
        quantity: 5,
        unitPrice: 200,
        totalPrice: 1000,
      },
      {
        orderId: order.id,
        itemType: 'Pants',
        quantity: 2,
        unitPrice: 250,
        totalPrice: 500,
      },
    ]);
});
```

### UPDATE Operations

#### 1. **Update Single Record**

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const updatedUser = await db
  .update(users)
  .set({
    email: 'newemail@example.com',
    updatedAt: new Date(),
  })
  .where(eq(users.id, userId))
  .returning();
```

#### 2. **Update Multiple Records**

```typescript
// Update all pending orders to washing
const updated = await db
  .update(orders)
  .set({ status: 'WASHING' })
  .where(eq(orders.status, 'PENDING'))
  .returning();
```

#### 3. **Conditional Updates**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Update with conditions
const result = await db
  .update(orders)
  .set({
    status: 'READY',
    completedDate: new Date(),
  })
  .where(
    and(
      eq(orders.id, orderId),
      eq(orders.status, 'PACKING')
    )
  )
  .returning();
```

### DELETE Operations

#### 1. **Delete Single Record**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

const deleted = await db
  .delete(orders)
  .where(eq(orders.id, orderId))
  .returning();
```

#### 2. **Delete with Condition**

```typescript
// Delete cancelled orders older than 30 days
const expired = new Date();
expired.setDate(expired.getDate() - 30);

const deleted = await db
  .delete(orders)
  .where(
    and(
      eq(orders.status, 'CANCELLED'),
      lt(orders.createdAt, expired)
    )
  )
  .returning();
```

---

## Advanced Query Operations

### JOIN Operations

#### 1. **Inner Join**

```typescript
import { db } from '@/db';
import { orders, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get orders with customer details
const ordersWithCustomers = await db
  .select({
    orderId: orders.id,
    orderNumber: orders.orderNumber,
    customerName: users.fullName,
    customerEmail: users.email,
    totalAmount: orders.totalAmount,
  })
  .from(orders)
  .innerJoin(users, eq(orders.customerId, users.id));
```

#### 2. **Left Join**

```typescript
// Get orders and optionally driver info
const ordersWithDrivers = await db
  .select({
    orderNumber: orders.orderNumber,
    driverName: users.fullName,
    status: orders.status,
  })
  .from(orders)
  .leftJoin(users, eq(orders.driverId, users.id));
```

#### 3. **Multiple Joins**

```typescript
import { db } from '@/db';
import { orders, users, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get complete order details
const completedOrders = await db
  .select({
    orderNumber: orders.orderNumber,
    customerName: users.fullName,
    totalAmount: orders.totalAmount,
    paymentStatus: payments.status,
    paymentMethod: payments.paymentMethod,
  })
  .from(orders)
  .innerJoin(users, eq(orders.customerId, users.id))
  .innerJoin(payments, eq(orders.id, payments.orderId));
```

### Aggregation Queries

#### 1. **COUNT**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

// Count all orders
const [result] = await db
  .select({ total: count() })
  .from(orders);

// Count pending orders
const [pending] = await db
  .select({ count: count() })
  .from(orders)
  .where(eq(orders.status, 'PENDING'));
```

#### 2. **SUM/AVG/MIN/MAX**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { sum, avg, min, max } from 'drizzle-orm';

// Calculate totals
const [stats] = await db
  .select({
    totalRevenue: sum(orders.totalAmount),
    averageOrderValue: avg(orders.totalAmount),
    minAmount: min(orders.totalAmount),
    maxAmount: max(orders.totalAmount),
  })
  .from(orders);
```

#### 3. **GROUP BY**

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { count, sum, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Revenue by status
const revenueByStatus = await db
  .select({
    status: orders.status,
    orderCount: count(),
    totalRevenue: sum(orders.totalAmount),
  })
  .from(orders)
  .groupBy(orders.status);

// Daily revenue
const dailyRevenue = await db
  .select({
    date: sql`DATE(${orders.receivedDate})`,
    revenue: sum(orders.totalAmount),
    orderCount: count(),
  })
  .from(orders)
  .groupBy(sql`DATE(${orders.receivedDate})`)
  .orderBy(sql`DATE(${orders.receivedDate}) DESC`);
```

### Pagination

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';

interface PaginationParams {
  page: number;
  limit: number;
}

async function getPaginatedOrders(params: PaginationParams) {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(orders);

  // Get paginated results
  const data = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
```

### Sorting & Ordering

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';

// Order by single column
const ascending = await db
  .select()
  .from(orders)
  .orderBy(asc(orders.createdAt));

// Order by multiple columns
const sorted = await db
  .select()
  .from(orders)
  .orderBy(desc(orders.totalAmount), asc(orders.createdAt));
```

---

## Transaction Handling

### Basic Transaction

```typescript
import { db } from '@/db';
import { orders, payments, transactions } from '@/db/schema';

// Atomic operation: Create order and payment together
await db.transaction(async (tx) => {
  const [order] = await tx
    .insert(orders)
    .values({ customerId, orderNumber, totalAmount })
    .returning();

  await tx
    .insert(payments)
    .values({ orderId: order.id, amount: totalAmount });

  await tx
    .insert(transactions)
    .values({ orderId: order.id, type: 'INCOME', amount: totalAmount });
});
```

### Rollback on Error

```typescript
await db.transaction(async (tx) => {
  try {
    const [order] = await tx
      .insert(orders)
      .values({ customerId, orderNumber })
      .returning();

    // If this fails, entire transaction rolls back
    const payment = await externalPaymentAPI.process(order.id);

    await tx
      .insert(payments)
      .values({ orderId: order.id, amount: payment.amount });
  } catch (error) {
    // Transaction automatically rolls back
    throw new PaymentProcessingError('Payment failed');
  }
});
```

---

## Type Safety

### Using Inferred Types

```typescript
import { db } from '@/db';
import { orders } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Select type (full record from database)
type Order = InferSelectModel<typeof orders>;

// Insert type (required fields for insertion)
type NewOrder = InferInsertModel<typeof orders>;

// Function with proper typing
async function getOrder(id: string): Promise<Order | undefined> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id));
  return order;
}

async function createOrder(data: NewOrder): Promise<Order> {
  const [order] = await db.insert(orders).values(data).returning();
  return order;
}
```

### Type-Safe Queries

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';

// Compiler checks column names and types
const result = await db
  .select({
    userId: users.id,
    userEmail: users.email,
    // userInvalidField: users.invalidField, // ❌ Compiler error
  })
  .from(users);

// Result type is:
// Array<{ userId: string; userEmail: string }>
```

---

## Common Service Patterns

### Create a Service Class

```typescript
import { db } from '@/db';
import { orders, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export class OrderService {
  async createOrder(customerId: string, data: OrderInput) {
    return await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          customerId,
          orderNumber: this.generateOrderNumber(),
          totalAmount: data.totalAmount,
          status: 'PENDING',
        })
        .returning();

      // Create order items
      await tx.insert(orderItems).values(
        data.items.map(item => ({
          orderId: order.id,
          ...item,
        }))
      );

      return order;
    });
  }

  async getOrder(orderId: string) {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .then(results => results[0]);
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    return await db
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
  }

  async getCustomerOrders(customerId: string, limit = 10) {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  private generateOrderNumber() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage in controller
const orderService = new OrderService();
const newOrder = await orderService.createOrder(customerId, orderData);
```

---

## Error Handling

### Database Errors

```typescript
import { db } from '@/db';

try {
  await db.insert(users).values({ email: 'duplicate@example.com' });
} catch (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    throw new DuplicateEmailError('Email already exists');
  }
  if (error.code === '23503') {
    // Foreign key constraint violation
    throw new InvalidReferenceError('Customer not found');
  }
  throw new DatabaseError('Database operation failed');
}
```

### Connection Errors

```typescript
try {
  await checkDatabaseConnection();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Database server is not running');
  }
  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was lost');
  }
  process.exit(1);
}
```

---

## Performance Tips

### 1. **Use Indexes Effectively**

```typescript
// Good - uses indexed column
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'));

// Bad - filters on non-indexed column
const user = await db
  .select()
  .from(users)
  .where(eq(users.address, 'Some Address'));
```

### 2. **Select Only Required Columns**

```typescript
// Good - select specific columns
const emails = await db
  .select({ email: users.email })
  .from(users);

// Avoid - select all columns if not needed
const allData = await db.select().from(users);
```

### 3. **Use Batch Operations**

```typescript
// Good - single batch insert
await db.insert(orders).values(manyOrders);

// Avoid - multiple inserts
for (const order of manyOrders) {
  await db.insert(orders).values(order);
}
```

### 4. **Add LIMIT for Large Results**

```typescript
// Good
const recentOrders = await db
  .select()
  .from(orders)
  .orderBy(desc(orders.createdAt))
  .limit(50);

// Avoid - loads all orders into memory
const allOrders = await db.select().from(orders);
```

---

## Debugging Queries

### Enable Query Logging

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres({
  url: process.env.DATABASE_URL,
  onnotice: (notice) => console.log('Notice:', notice),
});

// With logging
export const db = drizzle(queryClient, {
  schema,
  logger: true, // Enable query logging
});
```

### Log Generated SQL

```typescript
import { sql } from 'drizzle-orm';

const query = db
  .select()
  .from(orders)
  .where(eq(orders.status, 'PENDING'));

console.log(query.toSQL()); // View generated SQL
```

---

**Last Updated:** March 24, 2026  
**Drizzle ORM:** 0.28+  
**Node.js:** 18+
