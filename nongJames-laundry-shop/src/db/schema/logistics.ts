import {
  pgTable, uuid, text,
  timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { orders } from './orders'

export const taskTypeEnum = pgEnum('task_type', ['pickup', 'delivery'])
export const taskStatusEnum = pgEnum('task_status', [
  'assigned', 'in_progress', 'completed', 'cancelled'
])

export const driverTasks = pgTable('driver_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  driverId: uuid('driver_id').notNull()
    .references(() => users.id),
  taskType: taskTypeEnum('task_type').notNull(),
  status: taskStatusEnum('status').notNull().default('assigned'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
})
