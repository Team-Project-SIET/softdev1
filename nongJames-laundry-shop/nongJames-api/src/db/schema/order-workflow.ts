import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  foreignKey,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { users } from './users';

/**
 * Order Workflow History Table
 * Tracks all status changes and transitions for orders
 * Audit trail for order progression through the workflow
 */
export const orderWorkflowHistory = pgTable(
  'order_workflow_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    
    // Status transition
    fromStatus: varchar('from_status', { length: 50 }),
    toStatus: varchar('to_status', { length: 50 }).notNull(),
    
    // Who made the change
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    
    // Why
    reason: text('reason'),
    notes: text('notes'),
    
    // Tracking
    transitionedAt: timestamp('transitioned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('order_workflow_history_order_id_idx').on(table.orderId),
    toStatusIdx: index('order_workflow_history_to_status_idx').on(table.toStatus),
  })
);

export type OrderWorkflowHistory = typeof orderWorkflowHistory.$inferSelect;
export type NewOrderWorkflowHistory = typeof orderWorkflowHistory.$inferInsert;

/**
 * Order Updates Timeline Table
 * More detailed tracking of order events (scanning, delivery attempts, etc.)
 */
export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    
    // Event details
    eventType: varchar('event_type', { length: 100 }).notNull(), // CREATED, WASHED, SCANNED, DELIVERED, ETC.
    eventDescription: text('event_description'),
    eventLocation: varchar('event_location', { length: 255 }),
    
    // Who triggered the event
    triggeredBy: uuid('triggered_by').references(() => users.id, { onDelete: 'set null' }),
    
    // Metadata
    latitude: varchar('latitude', { length: 50 }),
    longitude: varchar('longitude', { length: 50 }),
    photoUrl: text('photo_url'),
    
    // Timing
    eventDate: timestamp('event_date', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('order_events_order_id_idx').on(table.orderId),
    eventTypeIdx: index('order_events_event_type_idx').on(table.eventType),
  })
);

export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
