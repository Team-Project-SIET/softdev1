import {
  pgTable, uuid, varchar, text,
  decimal, timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { customers } from './customers'
import { users } from './auth'
import { services } from './services'

export const orderStatusEnum = pgEnum('order_status', [
  'pending_pickup', 'washing', 'packing',
  'ready_for_delivery', 'completed', 'cancelled'
])
export const orderTypeEnum = pgEnum('order_type', ['b2c', 'b2b'])
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'failed', 'refunded'
])

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(), // NJ-20260313-001
  customerId: uuid('customer_id').notNull()
    .references(() => customers.id),
  createdBy: uuid('created_by').notNull()
    .references(() => users.id),
  status: orderStatusEnum('status').notNull().default('pending_pickup'),
  orderType: orderTypeEnum('order_type').notNull().default('b2c'),
  pickupAddress: text('pickup_address'),
  deliveryAddress: text('delivery_address'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 })
    .notNull().default('0'),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 })
    .notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 })
    .notNull().default('0'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdateFn(() => new Date()),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull()
    .references(() => services.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
})

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  status: orderStatusEnum('status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
