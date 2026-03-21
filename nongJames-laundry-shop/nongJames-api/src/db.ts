import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// ── Import Schema จาก Next.js project ──────────────────────────────
// เราวาง schema ไว้ใน ../src/db/schema/ แล้ว
// API สามารถใช้ร่วมกันได้เลยไม่ต้องเขียนซ้ำ
import * as authSchema       from '../../src/db/schema/auth'
import * as customersSchema  from '../../src/db/schema/customers'
import * as servicesSchema   from '../../src/db/schema/services'
import * as ordersSchema     from '../../src/db/schema/orders'
import * as logisticsSchema  from '../../src/db/schema/logistics'
import * as paymentsSchema   from '../../src/db/schema/payments'
import * as financeSchema    from '../../src/db/schema/finance'
import * as notiSchema       from '../../src/db/schema/notifications'

// ── สร้าง postgres client ────────────────────────────────────────────
// postgres() = เปิด connection pool ไปยัง PostgreSQL
// process.env.DATABASE_URL อ่านจาก .env
const client = postgres(process.env.DATABASE_URL!)

// ── สร้าง Drizzle instance ──────────────────────────────────────────
// drizzle() = ห่อ client ด้วย ORM layer
// schema บอก Drizzle ว่ามี table ชื่ออะไรบ้าง
// ทำให้ query แบบ type-safe ได้
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...customersSchema,
    ...servicesSchema,
    ...ordersSchema,
    ...logisticsSchema,
    ...paymentsSchema,
    ...financeSchema,
    ...notiSchema,
  },
})

// ── Re-export ทุก table ──────────────────────────────────────────────
// ไฟล์อื่น import จาก db.ts ที่เดียวได้เลย
// เช่น: import { db, users, orders } from '../db'
export * from '../../src/db/schema/auth.ts'
export * from '../../src/db/schema/customers.ts'
export * from '../../src/db/schema/services.ts'
export * from '../../src/db/schema/orders.ts'
export * from '../../src/db/schema/logistics.ts'
export * from '../../src/db/schema/payments.ts'
export * from '../../src/db/schema/finance.ts'
export * from '../../src/db/schema/notifications.ts'
