import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// ── Import Schema from centralized index ────────────────────────────
import * as schema from './db/schema'

// ── สร้าง postgres client ────────────────────────────────────────────
const client = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/laundry')

// ── สร้าง Drizzle instance ──────────────────────────────────────────
export const db = drizzle(client, {
  schema,
})

// ── Re-export ทุก table และ enum ────────────────────────────────────
export * from './db/schema'
