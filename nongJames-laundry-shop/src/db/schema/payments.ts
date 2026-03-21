import {
  pgTable, uuid, varchar,
  numeric, timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { orders } from './orders'

export const paymentMethodEnum = pgEnum('payment_method', [
  'promptpay_qr', 'truewallet', 'scb_easy', 'omise_card'
])
export const paymentRecordStatusEnum = pgEnum('payment_record_status', [
  'pending', 'success', 'failed', 'refunded'
])

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  status: paymentRecordStatusEnum('status').notNull().default('pending'),
  referenceId: varchar('reference_id', { length: 255 }),
  slipImageUrl: varchar('slip_image_url', { length: 500 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
