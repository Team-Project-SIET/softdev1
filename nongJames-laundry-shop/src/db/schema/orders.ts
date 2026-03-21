import {
  pgTable, uuid, varchar, text,
  numeric, timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { customers } from './customers'
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
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').notNull()
    .references(() => customers.id),
  createdBy: uuid('created_by').notNull()
    .references(() => users.id),
  status: orderStatusEnum('status').notNull().default('pending_pickup'),
  orderType: orderTypeEnum('order_type').notNull().default('b2c'),
  pickupAddress: text('pickup_address'),
  deliveryAddress: text('delivery_address'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 })
    .notNull().default('0'),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 })
    .notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
    .notNull().default('0'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdate(() => new Date()),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull()
    .references(() => services.id),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
})

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by').notNull()
    .references(() => users.id),
  status: orderStatusEnum('status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
