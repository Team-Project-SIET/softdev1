import {
  pgTable, uuid, text,
  timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { users } from './auth'

export const taskTypeEnum = pgEnum('task_type', [
  'pickup',   // Driver ไปรับผ้าจากลูกค้า
  'delivery', // Driver ไปส่งผ้าคืนลูกค้า
])

export const taskStatusEnum = pgEnum('task_status', [
  'assigned',    // Admin มอบหมายแล้ว
  'in_progress', // Driver กำลังทำอยู่
  'completed',   // เสร็จแล้ว
  'cancelled',   // ยกเลิก
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
  completedAt: timestamp('completed_at'), // null = ยังไม่เสร็จ
  notes: text('notes'),
})
