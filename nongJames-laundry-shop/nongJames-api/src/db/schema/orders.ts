import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  pgEnum,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Order Status Enum
 * Workflow: Pending → Washing → Packing → Ready → Completed
 */
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'WASHING',
  'PACKING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]);

/**
 * Pickup/Delivery Type
 */
export const deliveryTypeEnum = pgEnum('delivery_type', ['WALK_IN', 'PICKUP', 'DELIVERY']);

/**
 * Orders Table
 * Main order management table linking customer, services, and driver
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Order reference
    orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
    
    // Customer relationship
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Driver relationship (nullable until assigned)
    driverId: uuid('driver_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Order status
    status: orderStatusEnum('status').notNull().default('PENDING'),
    
    // Service type
    deliveryType: deliveryTypeEnum('delivery_type').notNull().default('WALK_IN'),
    
    // Pricing
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
    discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
    tax: numeric('tax', { precision: 10, scale: 2 }).default('0'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    
    // Special services
    isRushService: boolean('is_rush_service').default(false),
    rushServiceCharge: numeric('rush_service_charge', { precision: 10, scale: 2 }),
    isDryClean: boolean('is_dry_clean').default(false),
    specialNotes: text('special_notes'),
    
    // Loyalty points
    loyaltyPointsEarned: integer('loyalty_points_earned').default(0),
    
    // Dates
    receivedDate: timestamp('received_date', { withTimezone: true }).notNull().defaultNow(),
    estimatedReadyDate: timestamp('estimated_ready_date', { withTimezone: true }),
    completedDate: timestamp('completed_date', { withTimezone: true }),
    actualDeliveryDate: timestamp('actual_delivery_date', { withTimezone: true }),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    customerIdIdx: index('orders_customer_id_idx').on(table.customerId),
    driverIdIdx: index('orders_driver_id_idx').on(table.driverId),
    statusIdx: index('orders_status_idx').on(table.status),
    orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
    receivedDateIdx: index('orders_received_date_idx').on(table.receivedDate),
  })
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

// Order items defined in order-items.ts (with serviceId for services catalog)
