import Elysia, { t } from 'elysia'
import { eq, gte, lte, and, sum, desc, sql } from 'drizzle-orm'
import { db, transactions, expenses, payments, orders } from '../db'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'
import type { expenseCategoryEnum } from '../db/schema/expenses'

export const financeRoutes = new Elysia({ prefix: '/finance' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── GET /finance/dashboard ───────────────────────────────────────────
  // Executive Dashboard — สรุปการเงินภาพรวม
  // แสดง: รายรับ, รายจ่าย, กำไร ในช่วงเดือนนั้น
  .get('/dashboard', async ({ query }) => {
    // รับ filter เดือน ถ้าไม่ส่งมา ใช้เดือนปัจจุบัน
    const now = new Date()
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1) // วันแรกของเดือน

    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0) // วันสุดท้ายของเดือน

    const startDateStr = startDate.toISOString().slice(0, 10)
    const endDateStr = endDate.toISOString().slice(0, 10)

    // ① รายรับ = ยอด payment ที่ COMPLETED ในช่วงเวลา
    const incomeData = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(
        eq(payments.status, 'COMPLETED'),
        gte(payments.completedAt, sql`${startDate}`),
        lte(payments.completedAt, sql`${endDate}`),
      ))
      .then(r => Number(r[0]?.total ?? 0))

    // ② รายจ่าย = ยอด expenses ในช่วงเวลา
    const expenseData = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDateStr),
        lte(expenses.expenseDate, endDateStr),
      ))
      .then(r => Number(r[0]?.total ?? 0))

    // ③ กำไร = รายรับ - รายจ่าย
    const profit = incomeData - expenseData

    return {
      success: true,
      message: 'ok',
      data: {
        period: {
          start: startDateStr,
          end:   endDateStr,
        },
        income:   incomeData,
        expenses: expenseData,
        profit,  // บวก = กำไร, ลบ = ขาดทุน
      }
    }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
    query: t.Object({
      startDate: t.Optional(t.String()),
      endDate:   t.Optional(t.String()),
    }),
  })

  // ── GET /finance/transactions ────────────────────────────────────────
  // ดู transactions จาก SCB API
  .get('/transactions', async () => {
    const result = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.transactionDate))

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
  })

  // ── GET /finance/expenses ────────────────────────────────────────────
  // ดูรายจ่ายทั้งหมด
  .get('/expenses', async () => {
    const result = await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.expenseDate))

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
  })

  // ── POST /finance/expenses ───────────────────────────────────────────
  // Admin บันทึกรายจ่าย
  .post('/expenses', async ({ body, set }) => {
    const [expense] = await db
      .insert(expenses)
      .values({
        category: body.category as typeof expenseCategoryEnum.enumValues[number],
        description: body.description,
        amount: body.amount,
        expenseDate: body.expenseDate,
        receiptUrl: body.receiptUrl,
      })
      .returning()

    set.status = 201
    return { success: true, message: 'บันทึกรายจ่ายสำเร็จ', data: expense }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    body: t.Object({
      category:    t.Union([
        t.Literal('utilities'),
        t.Literal('salary'),
        t.Literal('supplies'),
        t.Literal('maintenance'),
        t.Literal('other'),
      ]),
      description: t.Optional(t.String()),
      amount:      t.String(),
      expenseDate: t.String(), // format: YYYY-MM-DD
      receiptUrl:  t.Optional(t.String()),
    }),
  })
