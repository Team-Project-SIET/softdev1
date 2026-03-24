import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { users } from './users';

/**
 * Task Type Enum
 */
export const taskTypeEnum = pgEnum('task_type', ['pickup', 'delivery']);

/**
 * Task Status Enum
 */
export const taskStatusEnum = pgEnum('task_status', [
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * Driver Tasks Table
 * Simple task assignments for drivers
 */
export const driverTasks = pgTable(
  'driver_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    driverId: uuid('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Task details
    taskType: taskTypeEnum('task_type').notNull(),
    status: taskStatusEnum('status').notNull().default('assigned'),

    // Notes
    notes: text('notes'),

    // Timestamps
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('driver_tasks_order_id_idx').on(table.orderId),
    driverIdIdx: index('driver_tasks_driver_id_idx').on(table.driverId),
    statusIdx: index('driver_tasks_status_idx').on(table.status),
    assignedAtIdx: index('driver_tasks_assigned_at_idx').on(table.assignedAt),
  })
);

export type DriverTask = typeof driverTasks.$inferSelect;
export type NewDriverTask = typeof driverTasks.$inferInsert;
