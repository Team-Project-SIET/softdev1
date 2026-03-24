import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * OAuth Accounts Table
 * Stores OAuth provider information for users (LINE, Google, etc.)
 */
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // User reference
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // OAuth provider info
    provider: varchar('provider', { length: 50 }).notNull(), // 'line', 'google', etc.
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),

    // LINE specific fields
    lineUserId: varchar('line_user_id', { length: 255 }),
    lineDisplayName: varchar('line_display_name', { length: 255 }),
    linePictureUrl: text('line_picture_url'),

    // Tokens (encrypted in production)
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),

    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('oauth_accounts_user_id_idx').on(table.userId),
    providerIdx: index('oauth_accounts_provider_idx').on(table.provider),
    providerAccountIdIdx: index('oauth_accounts_provider_account_id_idx').on(table.providerAccountId),
    lineUserIdIdx: index('oauth_accounts_line_user_id_idx').on(table.lineUserId),
  })
);

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;
