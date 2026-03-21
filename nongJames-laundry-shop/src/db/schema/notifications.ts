import {
  pgTable, uuid, varchar, text,
  timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { customers } from './customers'
import { orders } from './orders'

export const notificationTypeEnum = pgEnum('notification_type', [
  'status_update', 'payment_reminder', 'promotion'
])
export const notificationStatusEnum = pgEnum('notification_status', [
  'pending', 'sent', 'failed'
])

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'set null' }),
  type: notificationTypeEnum('type').notNull(),
  message: text('message').notNull(),
  lineMessageId: varchar('line_message_id', { length: 255 }),
  status: notificationStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
