# DTO Refactoring Guide - Elysia Schemas & TypeScript Types

## Overview

Your DTO files have been refactored from plain TypeScript classes (which cause "Property has no initializer" errors) to **Elysia type-safe schemas** with corresponding **TypeScript interfaces**.

### Benefits

✅ **Type Safety** - Compile-time type checking with `Static<typeof ...>`
✅ **Validation** - Built-in request validation with Elysia schemas
✅ **No Initializer Errors** - Interfaces replace classes for pure typing
✅ **Documentation** - Clear descriptions for each field
✅ **Backwards Compatible** - Legacy classes still available (marked @deprecated)

---

## Schema Pattern

### Before (Class-based - causes errors)

```typescript
export class CreateOrderDTO {
  customerId: string;           // ❌ Error: Property has no initializer
  items: any[];
  notes?: string;
  pickupDate: Date;
}
```

### After (Schema-based - proper typing)

```typescript
export const CreateOrderSchema = t.Object({
  customerId: t.String({ minLength: 1 }),
  items: t.Array(CreateOrderItemSchema, { minItems: 1 }),
  notes: t.Optional(t.String()),
  pickupDate: t.Date(),
});

export type CreateOrder = Static<typeof CreateOrderSchema>;
```

---

## Using Schemas in Routes

### Example 1: Creating an Order

**File:** `src/modules/orders/orders.routes.ts`

```typescript
import { Elysia } from 'elysia';
import { CreateOrderSchema, OrderResponseSchema } from '@/common/dto';

export function createOrderRoutes(): Elysia {
  return new Elysia({ prefix: '/orders' })
    
    // ✅ POST with schema validation
    .post('/', 
      async ({ body }) => {
        // body is automatically validated against CreateOrderSchema
        // TypeScript knows: body: CreateOrder
        
        const order = await orderService.createOrder(
          body.customerId,
          body.items,
          body.notes
        );
        
        return { success: true, data: order };
      },
      { 
        body: CreateOrderSchema,  // ← Request validation
        response: {
          200: t.Object({
            success: t.Boolean(),
            data: OrderResponseSchema,  // ← Response validation
          })
        }
      }
    );
}
```

### Example 2: Route with Parameters

**File:** `src/modules/orders/orders.routes.ts`

```typescript
.get(
  '/:id',
  async ({ params }) => {
    const order = await orderService.getOrderById(params.id);
    return { success: true, data: order };
  },
  {
    params: t.Object({
      id: t.String({ minLength: 1, description: 'Order ID' }),
    }),
    response: {
      200: OrderResponseSchema,
    },
  }
)
```

### Example 3: Update with Optional Fields

**File:** `src/modules/orders/orders.routes.ts`

```typescript
import { UpdateOrderSchema } from '@/common/dto';

.patch(
  '/:id',
  async ({ params, body }) => {
    // body is UpdateOrder type (all fields optional)
    const updated = await orderService.updateOrderStatus(
      params.id,
      body.status,  // only if provided
      body.notes
    );
    return { success: true, data: updated };
  },
  {
    params: t.Object({ id: t.String() }),
    body: UpdateOrderSchema,  // ← All fields optional
  }
)
```

---

## Using Schemas in Controllers

### Example: OrdersController

**File:** `src/modules/orders/controllers/orders.controller.ts`

```typescript
import { CreateOrder, UpdateOrder, OrderResponse } from '@/common/dto';
import { OrderService } from '../services/order.service';

export class OrdersController {
  private orderService = new OrderService();

  // Type-safe method with interfaces
  async createOrder(body: CreateOrder): Promise<OrderResponse> {
    const order = await this.orderService.createOrder(
      body.customerId,
      body.items,
      body.notes
    );
    return order;
  }

  async updateOrder(id: string, body: UpdateOrder): Promise<OrderResponse> {
    if (body.status) {
      await this.orderService.updateOrderStatus(id, body.status);
    }
    return this.orderService.getOrderById(id);
  }

  // No need for explicit validation - Elysia handles it
}
```

---

## Enum Usage

### Order Status Enum (SRS v2.4)

All schemas use proper Elysia enums:

```typescript
status: t.Enum(
  {
    PENDING: 'PENDING',
    WASHING: 'WASHING',
    PACKING: 'PACKING',
    READY: 'READY',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
  { description: 'Current order status' }
)
```

**Valid Status Transitions:**
```
PENDING → WASHING → PACKING → READY → COMPLETED
(Or CANCELLED at any point)
```

### Payment Status Enum

```typescript
status: t.Enum(
  {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  }
)
```

---

## Optional Fields

### Using t.Optional()

```typescript
// Field is optional in request/response
notes: t.Optional(t.String({ description: 'Order notes' }))

// Field can be undefined
type Order = {
  id: string;
  notes?: string;  // ← Optional
}
```

### In Controllers

```typescript
async createOrder(body: CreateOrder) {
  // body.notes is string | undefined
  if (body.notes) {
    console.log(body.notes);  // ✅ Type safe
  }
}
```

---

## Date Fields

### Using t.Date()

```typescript
export const OrderResponseSchema = t.Object({
  receivedDate: t.Date({ description: 'When order was received' }),
  estimatedReadyDate: t.Optional(t.Date({ description: 'Estimated ready date' })),
  actualDeliveryDate: t.Optional(t.Date({ description: 'When delivered' })),
  createdAt: t.Date({ description: 'Creation timestamp' }),
  updatedAt: t.Date({ description: 'Last update' }),
});
```

**Type inference:**
```typescript
type Order = Static<typeof OrderResponseSchema>;
// {
//   receivedDate: Date;        ✅ Type is Date
//   estimatedReadyDate?: Date;
//   createdAt: Date;
// }
```

---

## Array Fields

### Using t.Array()

```typescript
// Array with type constraint
items: t.Array(CreateOrderItemSchema, {
  minItems: 1,
  description: 'Order items',
})

// Type inference
type Order = Static<typeof CreateOrderSchema>;
// {
//   items: CreateOrderItem[];  ✅ Array of items
// }
```

---

## Pagination Schemas

### Example: Paginated Order List

```typescript
export const OrderListSchema = t.Object({
  orders: t.Array(OrderResponseSchema),
  pagination: t.Object({
    page: t.Number({ minimum: 1 }),
    limit: t.Number({ minimum: 1, maximum: 100 }),
    total: t.Number({ minimum: 0 }),
    pages: t.Number({ minimum: 1 }),
  }),
});

export type OrderList = Static<typeof OrderListSchema>;
```

**In a route:**

```typescript
.get('/list', async ({ query }) => {
  const result = await orderService.listOrders(
    undefined,
    undefined,
    undefined,
    undefined,
    query.page || 1,
    query.limit || 10
  );

  return {
    orders: result.orders,
    pagination: {
      page: query.page || 1,
      limit: query.limit || 10,
      total: result.total,
      pages: result.pages,
    },
  };
}, {
  query: t.Object({
    page: t.Optional(t.Number({ minimum: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  }),
})
```

---

## All Available Schemas

### Order Schemas (src/common/dto/order.dto.ts)

| Schema | Type | Purpose |
|--------|------|---------|
| `CreateOrderItemSchema` | `CreateOrderItem` | Item creation |
| `OrderItemSchema` | `OrderItem` | Item response |
| `CreateOrderSchema` | `CreateOrder` | Create order request |
| `UpdateOrderSchema` | `UpdateOrder` | Update order request |
| `OrderResponseSchema` | `OrderResponse` | Order response |
| `OrderListSchema` | `OrderList` | Paginated orders |

### Payment Schemas (src/common/dto/payment.dto.ts)

| Schema | Type | Purpose |
|--------|------|---------|
| `CreatePaymentSchema` | `CreatePayment` | Create payment request |
| `PaymentResponseSchema` | `PaymentResponse` | Payment response |
| `PaymentListSchema` | `PaymentList` | Paginated payments |
| `RefundPaymentSchema` | `RefundPayment` | Refund request |

### Logistics Schemas (src/common/dto/logistics.dto.ts)

| Schema | Type | Purpose |
|--------|------|---------|
| `CreateDriverSchema` | `CreateDriver` | Create driver |
| `DriverResponseSchema` | `DriverResponse` | Driver response |
| `UpdateDriverSchema` | `UpdateDriver` | Update driver |
| `AssignOrderSchema` | `AssignOrder` | Assign driver |
| `DeliveryAssignmentSchema` | `DeliveryAssignment` | Assignment response |
| `UpdateDeliveryStatusSchema` | `UpdateDeliveryStatus` | Update status |
| `DeliveryListSchema` | `DeliveryList` | Paginated deliveries |

---

## Field Validation Examples

### String Validation

```typescript
customerId: t.String({
  minLength: 1,           // Minimum 1 character
  maxLength: 100,         // Maximum 100 characters
  pattern: '^[a-zA-Z]',   // Must match regex
  description: 'Customer ID'
})
```

### Number Validation

```typescript
amount: t.Number({
  minimum: 0.01,          // At least 0.01
  maximum: 999999,        // At most 999999
  description: 'Payment amount (THB)'
})

priority: t.Number({
  minimum: 1,
  maximum: 5,
  description: 'Priority level 1-5'
})
```

### Enum Validation

```typescript
status: t.Enum({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
})
```

### Email Validation

```typescript
email: t.String({
  format: 'email',
  description: 'Email address'
})
```

---

## Migration Checklist

When updating your routes, follow this checklist:

- [ ] Import schema from dto file: `import { CreateOrderSchema } from '@/common/dto'`
- [ ] Import type from dto file: `import type { CreateOrder } from '@/common/dto'`
- [ ] Add schema to route handler config: `{ body: CreateOrderSchema }`
- [ ] Use imported type for function parameters: `(body: CreateOrder)`
- [ ] Remove any manual validation (schema does it automatically)
- [ ] Update swagger/api docs (Elysia auto-generates from schemas)
- [ ] Test route with Swagger UI at `/docs`

---

## Backwards Compatibility

Legacy classes are still available but marked `@deprecated`:

```typescript
// ❌ Don't use (deprecated)
const dto = new CreateOrderDTO({...});

// ✅ Use instead
import { CreateOrder } from '@/common/dto';
const data: CreateOrder = {...};
```

---

## Error Handling

Elysia automatically validates and returns errors:

```typescript
// If request doesn't match schema:
POST /orders < invalid body >

// Elysia returns 400 automatically:
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "body.customerId": "Expected string, got undefined"
  }
}
```

---

## Summary

✅ **Use Elysia Schemas** for all request/response validation
✅ **Use TypeScript Interfaces** (via `Static<typeof ...>`) for typing
✅ **Never use plain classes** for DTOs
✅ **Use t.Optional()** for optional fields
✅ **Use t.Enum()** for status fields matching SRS
✅ **Use t.Date()** for timestamp fields
✅ **Document each field** with descriptions

Your API is now **type-safe, validated, and error-free!** 🚀
