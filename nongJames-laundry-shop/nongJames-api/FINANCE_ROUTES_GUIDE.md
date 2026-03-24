# Finance Routes Integration Guide

## Quick Integration

### 1. Import and Register in Your Main App

Update `src/index.ts` or `src/app.ts`:

```typescript
import Elysia from 'elysia';
import { financeRoutes } from '@/routes/finance';
import { checkDatabaseConnection } from '@/db';

const app = new Elysia();

// Database initialization
app.before(async () => {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    throw new Error('Database connection failed');
  }
});

// Register finance routes
app.use(financeRoutes);

// Register other routes
// app.use(orderRoutes);
// app.use(logisticsRoutes);
// etc.

// Health check endpoint
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

app.listen(process.env.PORT || 3001, (server) => {
  console.log(`🎵 Elysia is running at ${server.hostname}:${server.port}`);
});
```

---

## API Endpoints Reference

### 1. GET /api/finance/dashboard/summary

**Purpose:** Retrieve financial summary with total revenue, expenses, and net profit.

**Query Parameters:**
- `from` (optional): ISO date string - start date (default: 30 days ago)
- `to` (optional): ISO date string - end date (default: today)

**Request Example:**
```bash
curl -X GET "http://localhost:3001/api/finance/dashboard/summary?from=2026-02-24T00:00:00Z&to=2026-03-24T23:59:59Z"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15450.50,
    "totalExpenses": 3200.75,
    "netProfit": 12249.75,
    "transactionCount": 42,
    "dateRange": {
      "from": "2026-02-24T00:00:00.000Z",
      "to": "2026-03-24T23:59:59.000Z"
    }
  },
  "timestamp": "2026-03-24T10:30:45.123Z"
}
```

---

### 2. POST /api/finance/scb/sync

**Purpose:** Synchronize transactions from SCB Sandbox API (mocked).

**Request Body:**
```json
{
  "startDate": "2026-03-17T00:00:00Z",
  "endDate": "2026-03-24T23:59:59Z",
  "limit": 50
}
```

**Parameters:**
- `startDate` (optional): ISO date string - sync from date (default: 7 days ago)
- `endDate` (optional): ISO date string - sync to date (default: today)
- `limit` (optional): Number - max records to import (1-1000, default: 50)

**Request Example:**
```bash
curl -X POST "http://localhost:3001/api/finance/scb/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-17T00:00:00Z",
    "endDate": "2026-03-24T23:59:59Z",
    "limit": 25
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully imported 23 transactions",
  "transactionsImported": 23,
  "recordsProcessed": 25,
  "timestamp": "2026-03-24T10:32:15.456Z"
}
```

**Response (With Errors):**
```json
{
  "success": false,
  "message": "Successfully imported 20 transactions (2 errors)",
  "transactionsImported": 20,
  "recordsProcessed": 25,
  "timestamp": "2026-03-24T10:32:15.456Z",
  "errors": [
    "SCB-123456: Duplicate transaction",
    "SCB-789012: Invalid amount format"
  ]
}
```

---

### 3. GET /api/finance/transactions

**Purpose:** List all transactions with filtering and pagination.

**Query Parameters:**
- `page` (optional): Number - page number (default: 1)
- `limit` (optional): Number - records per page (1-100, default: 20)
- `from` (optional): ISO date string - start date (default: 30 days ago)
- `to` (optional): ISO date string - end date (default: today)
- `type` (optional): 'INCOME' | 'EXPENSE'
- `status` (optional): Transaction status string

**Request Example:**
```bash
curl -X GET "http://localhost:3001/api/finance/transactions?page=1&limit=20&type=INCOME"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "scbTransactionId": "SCB-1711234567000-0",
      "scbReferenceNo": "REF-1711234567000-0",
      "type": "INCOME",
      "status": "COMPLETED",
      "paymentMethod": "SCB_QR",
      "amount": 1250.50,
      "currency": "THB",
      "orderId": null,
      "userId": null,
      "description": "SCB Sync: INCOME",
      "transactionDate": "2026-03-24T10:15:00.000Z",
      "processedDate": "2026-03-24T10:32:15.000Z",
      "createdAt": "2026-03-24T10:32:15.000Z",
      "updatedAt": "2026-03-24T10:32:15.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "scbTransactionId": "SCB-1711234567001-1",
      "scbReferenceNo": "REF-1711234567001-1",
      "type": "INCOME",
      "status": "COMPLETED",
      "paymentMethod": "SCB_QR",
      "amount": 2100.75,
      "currency": "THB",
      "orderId": null,
      "userId": null,
      "description": "SCB Sync: INCOME",
      "transactionDate": "2026-03-23T14:45:00.000Z",
      "processedDate": "2026-03-24T10:32:15.000Z",
      "createdAt": "2026-03-24T10:32:15.000Z",
      "updatedAt": "2026-03-24T10:32:15.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  },
  "timestamp": "2026-03-24T10:35:00.123Z"
}
```

---

### 4. POST /api/finance/transactions/record

**Purpose:** Record a new transaction manually.

**Request Body:**
```json
{
  "type": "INCOME",
  "paymentMethod": "CASH",
  "amount": 500.00,
  "currency": "THB",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440001",
  "description": "Walk-in order payment",
  "category": "LAUNDRY_SERVICE",
  "transactionDate": "2026-03-24T10:00:00Z"
}
```

**Parameters:**
- `type` (required): 'INCOME' | 'EXPENSE'
- `paymentMethod` (required): Payment method string
- `amount` (required): Transaction amount (minimum: 0)
- `currency` (optional): Currency code (default: 'THB')
- `orderId` (optional): Related order ID
- `userId` (optional): Related user ID
- `description` (required): Transaction description
- `category` (optional): Transaction category
- `transactionDate` (optional): ISO date string (default: now)

**Request Example:**
```bash
curl -X POST "http://localhost:3001/api/finance/transactions/record" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INCOME",
    "paymentMethod": "CREDIT_CARD",
    "amount": 750.50,
    "description": "Online payment for order ORD-001",
    "category": "SERVICE_CHARGE"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "scbTransactionId": null,
    "scbReferenceNo": null,
    "type": "INCOME",
    "status": "COMPLETED",
    "paymentMethod": "CREDIT_CARD",
    "amount": 750.50,
    "currency": "THB",
    "orderId": null,
    "userId": null,
    "description": "Online payment for order ORD-001",
    "category": "SERVICE_CHARGE",
    "transactionDate": "2026-03-24T10:36:00.000Z",
    "processedDate": "2026-03-24T10:36:25.000Z",
    "createdAt": "2026-03-24T10:36:25.000Z",
    "updatedAt": "2026-03-24T10:36:25.000Z"
  },
  "message": "Transaction recorded successfully",
  "timestamp": "2026-03-24T10:36:25.123Z"
}
```

---

## Feature Details

### Dashboard Summary Calculation

The `/dashboard/summary` endpoint:

1. **Queries** the `transactions` table
2. **Filters** by:
   - Type = 'INCOME' for revenue
   - Type = 'EXPENSE' for expenses
   - Status = 'COMPLETED' (only completed transactions)
   - Date range (configurable via query params)
3. **Calculates**:
   - `totalRevenue`: SUM of all INCOME transactions
   - `totalExpenses`: SUM of all EXPENSE transactions
   - `netProfit`: totalRevenue - totalExpenses
   - `transactionCount`: Number of transactions in range

**Default Time Range:** Last 30 days

---

### SCB Sync Operation

The `/scb/sync` endpoint:

1. **Mocks** an SCB Sandbox API call with realistic transaction data
2. **Checks** for duplicate transactions using `scbTransactionId`
3. **Saves** new transactions to the `transactions` table
4. **Logs** all operations for debugging
5. **Returns** import summary with error details

**Mock Data Generation:**
- Creates transactions throughout the date range
- 70% INCOME, 30% EXPENSE distribution
- Random amounts: INCOME (500-2500 THB), EXPENSE (100-600 THB)
- Status: All marked as 'COMPLETED'

**Real-world Integration:**
Replace the `mockSCBApiCall()` function with actual SCB API calls:

```typescript
async function callSCBApi(params: {
  startDate: Date;
  endDate: Date;
  limit: number;
}) {
  const response = await fetch(process.env.SCB_API_URL + '/transactions', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SCB_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      limit: params.limit,
    }),
  });

  const data = await response.json();
  return data.transactions;
}
```

---

## Input Validation (Elysia t.schema)

### Query Validation (Summary)
```typescript
query: t.Object({
  from: t.Optional(t.String({ format: 'date-time' })),
  to: t.Optional(t.String({ format: 'date-time' })),
})
```

### Body Validation (SCB Sync)
```typescript
body: t.Object({
  startDate: t.Optional(t.String({ format: 'date-time' })),
  endDate: t.Optional(t.String({ format: 'date-time' })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
})
```

### Query Validation (List Transactions)
```typescript
query: t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  from: t.Optional(t.String({ format: 'date-time' })),
  to: t.Optional(t.String({ format: 'date-time' })),
  type: t.Optional(t.Union([t.Literal('INCOME'), t.Literal('EXPENSE')])),
  status: t.Optional(t.String()),
})
```

**Benefits:**
- ✅ Type-safe request/response handling
- ✅ Automatic validation with meaningful error messages
- ✅ ISO 8601 date format enforcement
- ✅ Number range validation (minimum/maximum)
- ✅ Union types for enum-like values

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2026-03-24T10:40:00.123Z"
}
```

**Common Errors:**

| Error | Cause |
|-------|-------|
| Invalid date format | Date not in ISO 8601 format |
| Limit exceeds maximum | limit > 1000 (SCB sync) or > 100 (transactions) |
| Page must be >= 1 | Invalid pagination page number |
| Type must be INCOME or EXPENSE | Invalid transaction type |
| Database connection failed | Cannot connect to PostgreSQL |

---

## Usage Examples

### Example 1: Get Today's Revenue

```bash
curl -X GET "http://localhost:3001/api/finance/dashboard/summary" \
  -H "Accept: application/json"

# Returns today's+ last 30 days summary
```

### Example 2: Calculate Weekly Profit

```bash
# Get last 7 days (starting Monday)
MONDAY=$(date -d 'last Monday' -u +%Y-%m-%dT00:00:00Z)
TODAY=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -X GET "http://localhost:3001/api/finance/dashboard/summary?from=$MONDAY&to=$TODAY"
```

### Example 3: Sync SCB Transactions Daily

Create a cron job or scheduled task:

```bash
# Run daily at 2 AM
0 2 * * * curl -X POST "http://localhost:3001/api/finance/scb/sync" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

### Example 4: Filter Expense Transactions

```bash
curl -X GET "http://localhost:3001/api/finance/transactions?type=EXPENSE&limit=50&page=1"
```

### Example 5: Record Manual Cash Payment

```bash
curl -X POST "http://localhost:3001/api/finance/transactions/record" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INCOME",
    "paymentMethod": "CASH",
    "amount": 1500,
    "description": "Walk-in customer payment - shirts (5 items)",
    "category": "WALK_IN_PAYMENT"
  }'
```

---

## Performance Considerations

### Database Indexes Used
- `transactions.transactionDate` - For date range filtering
- `transactions.type` - For INCOME/EXPENSE filtering
- `transactions.status` - For status filtering
- `transactions.scbTransactionId` - For duplicate checking

### Query Optimization
- **Dashboard Summary**: O(n) scan with aggregation
- **Transactions List**: Paginated with LIMIT/OFFSET
- **SCB Sync**: Batch inserts for performance

### Recommended Batch Sizes
- SCB Sync: 50-100 records per call
- Transactions List: 20-50 records per page

---

## Testing with Postman

### Collection Setup

```json
{
  "info": {
    "name": "Finance API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Dashboard Summary",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/finance/dashboard/summary"
      }
    },
    {
      "name": "SCB Sync",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/finance/scb/sync",
        "body": {
          "mode": "raw",
          "raw": "{\"limit\": 50}"
        }
      }
    },
    {
      "name": "List Transactions",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/finance/transactions?limit=20&page=1"
      }
    },
    {
      "name": "Record Transaction",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/finance/transactions/record",
        "body": {
          "mode": "raw",
          "raw": "{\"type\": \"INCOME\", \"paymentMethod\": \"CASH\", \"amount\": 500, \"description\": \"Test\"}"
        }
      }
    }
  ]
}
```

---

## Logging & Debugging

All operations log to console with `[FINANCE]` prefix:

```
[FINANCE] Dashboard Summary: Querying transactions from 2026-02-24 to 2026-03-24
[SCB SYNC] Fetching transactions from Sat Feb 24 2026 to Mon Mar 24 2026
[SCB SYNC] Received 50 records from SCB API
[SCB SYNC] Imported transaction SCB-1711234567000-0
[SCB SYNC] Transaction SCB-1711234567001-1 already exists, skipping
[SCB SYNC] Import completed: 48/50 successful
```

Enable debug mode in `.env`:
```env
DEBUG=finance:*
LOG_LEVEL=debug
```

---

**File:** `src/routes/finance.ts`  
**Last Updated:** March 24, 2026  
**Status:** ✅ Ready for Integration
