import { t, Static } from 'elysia';
import { OrderStatus } from '../enums';

// ════════════════════════════════════════════════════════════════════════════
// ORDER ITEM SCHEMAS & TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Schema for order item creation/request
 * Used when adding items to an order
 */
export const CreateOrderItemSchema = t.Object({
  serviceId: t.String({ minLength: 1, description: 'Service ID' }),
  quantity: t.Number({ minimum: 1, description: 'Quantity of items' }),
  unitPrice: t.Optional(t.Number({ minimum: 0, description: 'Unit price' })),
  description: t.Optional(t.String({ description: 'Item description' })),
});

/**
 * TypeScript interface inferred from CreateOrderItemSchema
 * Use this for type safety in your code
 */
export type CreateOrderItem = Static<typeof CreateOrderItemSchema>;

/**
 * Schema for order item response
 * Includes calculated fields and IDs
 */
export const OrderItemSchema = t.Object({
  id: t.String({ description: 'Item ID' }),
  orderId: t.String({ description: 'Order ID' }),
  serviceId: t.String({ description: 'Service ID' }),
  quantity: t.Number({ description: 'Quantity ordered' }),
  unitPrice: t.Number({ description: 'Price per unit (THB)' }),
  totalPrice: t.Number({ description: 'Total price (quantity × unitPrice)' }),
  description: t.Optional(t.String({ description: 'Item description' })),
  createdAt: t.Date({ description: 'Creation timestamp' }),
});

/**
 * TypeScript interface for order items in responses
 */
export type OrderItem = Static<typeof OrderItemSchema>;

// ════════════════════════════════════════════════════════════════════════════
// ORDER REQUEST/RESPONSE SCHEMAS & TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Schema for creating a new order
 * Validates request body in POST /orders
 */
export const CreateOrderSchema = t.Object({
  customerId: t.String({ minLength: 1, description: 'Customer/User ID' }),
  items: t.Array(CreateOrderItemSchema, {
    minItems: 1,
    description: 'Array of items to add to order',
  }),
  deliveryType: t.Enum(
    { PICKUP: 'PICKUP', DELIVERY: 'DELIVERY' },
    { description: 'Delivery method' }
  ),
  deliveryAddress: t.Optional(
    t.String({ description: 'Delivery address if type is DELIVERY' })
  ),
  notes: t.Optional(t.String({ description: 'Order notes/special requests' })),
});

/**
 * TypeScript interface for create order requests
 */
export type CreateOrder = Static<typeof CreateOrderSchema>;

/**
 * Schema for updating an existing order
 * All fields optional for PATCH requests
 */
export const UpdateOrderSchema = t.Object({
  status: t.Optional(
    t.Enum(
      {
        PENDING: 'PENDING',
        WASHING: 'WASHING',
        PACKING: 'PACKING',
        READY: 'READY',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
      },
      { description: 'New order status per SRS v2.4' }
    )
  ),
  items: t.Optional(
    t.Array(CreateOrderItemSchema, {
      description: 'Updated items list',
    })
  ),
  deliveryAddress: t.Optional(t.String({ description: 'Updated delivery address' })),
  notes: t.Optional(t.String({ description: 'Updated notes' })),
  deliveryDate: t.Optional(t.Date({ description: 'Updated delivery date' })),
});

/**
 * TypeScript interface for update order requests
 */
export type UpdateOrder = Static<typeof UpdateOrderSchema>;

/**
 * Schema for order response
 * Complete order with all calculated fields
 * (Status: PENDING → WASHING → PACKING → READY → COMPLETED, with CANCELLED at any point)
 */
export const OrderResponseSchema = t.Object({
  id: t.String({ description: 'Order ID' }),
  orderNumber: t.String({ description: 'Human-readable order number (e.g., ORD-123456-ABC)' }),
  customerId: t.String({ description: 'Customer ID' }),
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
  ),
  deliveryType: t.Enum(
    { PICKUP: 'PICKUP', DELIVERY: 'DELIVERY' },
    { description: 'Delivery method' }
  ),
  deliveryAddress: t.Optional(t.String({ description: 'Delivery address' })),
  subtotal: t.Number({ description: 'Subtotal before tax (THB)' }),
  taxAmount: t.Number({ description: 'Tax amount (7% VAT in Thailand)' }),
  deliveryFee: t.Number({ description: 'Delivery fee (THB)' }),
  totalAmount: t.Number({ description: 'Total amount (subtotal + tax + delivery fee)' }),
  loyaltyPointsEarned: t.Number({ description: 'Loyalty points earned (totalAmount / 100)' }),
  items: t.Array(OrderItemSchema, { description: 'Order line items' }),
  notes: t.Optional(t.String({ description: 'Order notes' })),
  driverId: t.Optional(t.String({ description: 'Assigned driver ID (logistics)' })),
  receivedDate: t.Date({ description: 'When order was received' }),
  estimatedReadyDate: t.Optional(t.Date({ description: 'Estimated ready for pickup/delivery' })),
  actualDeliveryDate: t.Optional(t.Date({ description: 'Actual delivery date' })),
  completedDate: t.Optional(t.Date({ description: 'When order was completed' })),
  createdAt: t.Date({ description: 'Creation timestamp' }),
  updatedAt: t.Date({ description: 'Last update timestamp' }),
});

/**
 * TypeScript interface for order responses
 * Use this throughout your application for type safety
 */
export type OrderResponse = Static<typeof OrderResponseSchema>;

/**
 * Schema for paginated order list response
 */
export const OrderListSchema = t.Object({
  orders: t.Array(OrderResponseSchema),
  pagination: t.Object({
    page: t.Number({ minimum: 1 }),
    limit: t.Number({ minimum: 1, maximum: 100 }),
    total: t.Number({ minimum: 0 }),
    pages: t.Number({ minimum: 1 }),
  }),
});

/**
 * TypeScript interface for paginated orders
 */
export type OrderList = Static<typeof OrderListSchema>;

// ════════════════════════════════════════════════════════════════════════════
// LEGACY CLASS EXPORTS (For backward compatibility if needed)
// Prefer using the schemas and interfaces above for new code
// ════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use CreateOrderSchema and CreateOrder type instead
 */
export class CreateOrderDTO implements CreateOrder {
  customerId!: string;
  items!: CreateOrderItem[];
  deliveryType!: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  notes?: string;

  constructor(data: CreateOrder) {
    this.customerId = data.customerId;
    this.items = data.items;
    this.deliveryType = data.deliveryType;
    this.deliveryAddress = data.deliveryAddress;
    this.notes = data.notes;
  }
}

/**
 * @deprecated Use UpdateOrderSchema and UpdateOrder type instead
 */
export class UpdateOrderDTO implements Partial<UpdateOrder> {
  status?: OrderStatus;
  items?: CreateOrderItem[];
  deliveryAddress?: string;
  notes?: string;
  deliveryDate?: Date;

  constructor(data: Partial<UpdateOrder>) {
    Object.assign(this, data);
  }
}

// Type helper for status
import { Static } from 'elysia';

/**
 * @deprecated Use OrderItemSchema and OrderItem type instead
 */
export class OrderItemDTO implements OrderItem {
  id!: string;
  orderId!: string;
  serviceId!: string;
  quantity!: number;
  unitPrice!: number;
  totalPrice!: number;
  description?: string;
  createdAt!: Date;

  constructor(data: OrderItem) {
    this.id = data.id;
    this.orderId = data.orderId;
    this.serviceId = data.serviceId;
    this.quantity = data.quantity;
    this.unitPrice = data.unitPrice;
    this.totalPrice = data.totalPrice;
    this.description = data.description;
    this.createdAt = data.createdAt;
  }
}

/**
 * @deprecated Use OrderResponseSchema and OrderResponse type instead
 */
export class OrderResponseDTO implements OrderResponse {
  id!: string;
  orderNumber!: string;
  customerId!: string;
  status!: OrderStatus;
  deliveryType!: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  subtotal!: number;
  taxAmount!: number;
  deliveryFee!: number;
  totalAmount!: number;
  loyaltyPointsEarned!: number;
  items!: OrderItem[];
  notes?: string;
  driverId?: string;
  receivedDate!: Date;
  estimatedReadyDate?: Date;
  actualDeliveryDate?: Date;
  completedDate?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: OrderResponse) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.customerId = data.customerId;
    this.status = data.status as OrderStatus;
    this.deliveryType = data.deliveryType;
    this.deliveryAddress = data.deliveryAddress;
    this.subtotal = data.subtotal;
    this.taxAmount = data.taxAmount;
    this.deliveryFee = data.deliveryFee;
    this.totalAmount = data.totalAmount;
    this.loyaltyPointsEarned = data.loyaltyPointsEarned;
    this.items = data.items;
    this.notes = data.notes;
    this.driverId = data.driverId;
    this.receivedDate = data.receivedDate;
    this.estimatedReadyDate = data.estimatedReadyDate;
    this.actualDeliveryDate = data.actualDeliveryDate;
    this.completedDate = data.completedDate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
