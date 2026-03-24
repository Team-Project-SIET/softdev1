import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { orders } from './orders';

/**
 * Notification Type
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  'ORDER_CREATED',
  'ORDER_STATUS_UPDATED',
  'ORDER_READY',
  'DELIVERY_SCHEDULED',
  'DELIVERY_IN_PROGRESS',
  'DELIVERY_COMPLETED',
  'PAYMENT_REQUIRED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_FAILED',
  'REFUND_ISSUED',
  'LOYALTY_POINTS_EARNED',
  'PROMOTION',
  'SERVICE_ALERT',
  'APPOINTMENT_REMINDER',
]);

/**
 * Notification Channel
 */
export const notificationChannelEnum = pgEnum('notification_channel', [
  'LINE_OA',
  'EMAIL',
  'SMS',
  'WEB_PUSH',
  'IN_APP',
]);

/**
 * Notifications Table
 * Stores all notifications sent to users
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Recipient
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Notification details
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    
    // Content
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    imageUrl: text('image_url'),
    
    // Reference
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    relatedId: varchar('related_id', { length: 255 }), // Generic reference ID
    
    // Action URL
    actionUrl: text('action_url'), // Deep link or URL to action
    
    // Status
    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    isSent: boolean('is_sent').default(false),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    
    // LINE specific
    lineMessageId: varchar('line_message_id', { length: 255 }),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    orderIdIdx: index('notifications_order_id_idx').on(table.orderId),
    typeIdx: index('notifications_type_idx').on(table.type),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

/**
 * LINE User Connection Table
 * Stores LINE user metadata for B2C integration
 */
export const lineUsers = pgTable(
  'line_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    
    // LINE user info
    lineUserId: varchar('line_user_id', { length: 255 }).unique().notNull(),
    displayName: varchar('display_name', { length: 255 }),
    pictureUrl: text('picture_url'),
    statusMessage: text('status_message'),
    
    // LINE friend status
    isFriend: boolean('is_friend').default(true),
    friendSince: timestamp('friend_since', { withTimezone: true }),
    
    // Preferences
    notificationsEnabled: boolean('notifications_enabled').default(true),
    language: varchar('language', { length: 10 }).default('th'),
    
    // LINE subscription info
    subscriptionStatus: varchar('subscription_status', { length: 50 }), // ACTIVE, INACTIVE
    lastInteraction: timestamp('last_interaction', { withTimezone: true }),
    
    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lineUserIdIdx: index('line_users_line_user_id_idx').on(table.lineUserId),
    userIdIdx: index('line_users_user_id_idx').on(table.userId),
  })
);

export type LineUser = typeof lineUsers.$inferSelect;
export type NewLineUser = typeof lineUsers.$inferInsert;

/**
 * Notification Templates
 * Define message templates for different notification types
 */
export const notificationTemplates = pgTable(
  'notification_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Template identification
    name: varchar('name', { length: 255 }).notNull().unique(),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    
    // Content
    title: varchar('title', { length: 255 }).notNull(),
    messageTemplate: text('message_template').notNull(), // Use {{placeholder}} for variables
    
    // Variables description
    variablesUsed: text('variables_used'), // JSON array of variable names
    
    // Status
    isActive: boolean('is_active').default(true),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('notification_templates_type_idx').on(table.type),
    channelIdx: index('notification_templates_channel_idx').on(table.channel),
  })
);

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
