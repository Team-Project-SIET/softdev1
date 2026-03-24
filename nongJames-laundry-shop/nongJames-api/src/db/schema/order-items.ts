import {
  pgTable,
  uuid,
  numeric,
  integer,
  text,
  timestamp,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { services } from './services';

/**
 * Order Items Table (Line Items)
 * Stores individual items/services for each order
 * Each order can have multiple items with different services
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // References
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
    
    // Item details
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
    serviceIdIdx: index('order_items_service_id_idx').on(table.serviceId),
  })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
