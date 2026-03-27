import Elysia, { t } from 'elysia'
import { eq, gte, lte, and, sum, desc } from 'drizzle-orm'
import { db, bankTransactions, expenses, payments, orders, users } from '../db'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'

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

    // ① รายรับ = ยอด payment ที่ success ในช่วงเวลา
    const incomeData = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(
        eq(payments.status, 'success'),
        gte(payments.paidAt, startDate),
        lte(payments.paidAt, endDate),
      ))
      .then(r => Number(r[0]?.total ?? 0))

    // ② รายจ่าย = ยอด expenses ในช่วงเวลา
    const expenseData = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate.toISOString().slice(0, 10)),
        lte(expenses.expenseDate, endDate.toISOString().slice(0, 10)),
      ))
      .then(r => Number(r[0]?.total ?? 0))

    // ③ กำไร = รายรับ - รายจ่าย
    const profit = incomeData - expenseData

    return {
      success: true,
      message: 'ok',
      data: {
        period: {
          start: startDate.toISOString().slice(0, 10),
          end:   endDate.toISOString().slice(0, 10),
        },
        income:   incomeData,
        expenses: expenseData,
        profit,  // บวก = กำไร, ลบ = ขาดทุน
      }
    }
  }, {
    beforeHandle: [requireRole(['admin', 'executive'])],
    query: t.Object({
      startDate: t.Optional(t.String()),
      endDate:   t.Optional(t.String()),
    }),
  })

  // ── GET /finance/transactions ────────────────────────────────────────
  // ดู bank transactions จาก SCB API
  .get('/transactions', async () => {
    const result = await db
      .select()
      .from(bankTransactions)
      .orderBy(desc(bankTransactions.transactionDate))

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['admin', 'executive'])],
  })

  // ── POST /finance/transactions/sync ─────────────────────────────────
  // ดึงข้อมูล transactions ใหม่จาก SCB API Sandbox
  // เรียกได้เฉพาะ Admin เพื่อ sync ข้อมูลล่าสุด
  .post('/transactions/sync', async ({ set }) => {
    try {
      // เรียก SCB API Sandbox
      // Docs: https://developer.scb.co.th/
      const scbRes = await fetch(
        `${process.env.SCB_API_URL}/v1/payment/billpayment/transactions`,
        {
          headers: {
            'Content-Type':  'application/json',
            'resourceOwnerId': process.env.SCB_API_KEY!,
            'requestUId':      crypto.randomUUID(),
          },
        }
      )

      const scbData = await scbRes.json() as any

      // SCB Sandbox return mock data
      // บันทึกลง DB ถ้ายังไม่มี (upsert ด้วย scbTransactionId)
      const txList = scbData?.data?.transactions ?? []
      let newCount = 0

      for (const tx of txList) {
        // เช็คว่ามีอยู่แล้วหรือยัง
        const existing = await db
          .select()
          .from(bankTransactions)
          .where(eq(bankTransactions.scbTransactionId, tx.transactionId))
          .limit(1)
          .then(r => r[0])

        if (!existing) {
          await db.insert(bankTransactions).values({
            scbTransactionId: tx.transactionId,
            type:             tx.type === 'CREDIT' ? 'credit' : 'debit',
            amount:           tx.amount.toString(),
            description:      tx.description ?? null,
            transactionDate:  new Date(tx.transactionDate),
            balanceAfter:     tx.balance?.toString() ?? null,
            rawData:          tx, // เก็บ raw ทั้งหมดไว้ก่อน
          })
          newCount++
        }
      }

      return {
        success: true,
        message: `Sync สำเร็จ เพิ่ม ${newCount} รายการใหม่`,
        data: { newCount }
      }

    } catch (err) {
      console.error('[SCB Sync Error]', err)
      set.status = 500
      return { success: false, message: 'SCB API error', data: null }
    }
  }, {
    beforeHandle: [requireRole(['admin'])],
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
    beforeHandle: [requireRole(['admin', 'executive'])],
  })

  // ── POST /finance/expenses ───────────────────────────────────────────
  // Admin บันทึกรายจ่าย
  .post('/expenses', async ({ body, user, set }) => {
    const [expense] = await db
      .insert(expenses)
      .values({
        ...body,
        createdBy: user!.id,
      })
      .returning()

    set.status = 201
    return { success: true, message: 'บันทึกรายจ่ายสำเร็จ', data: expense }
  }, {
    beforeHandle: [requireRole(['admin', 'staff'])],
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
// ── GET /finance/expenses ─────────────────────────────────────────────
.get('/expenses', async () => {
  const result = await db
    .select({
      id:          expenses.id,
      category:    expenses.category,
      description: expenses.description,
      amount:      expenses.amount,
      expenseDate: expenses.expenseDate,
      receiptUrl:  expenses.receiptUrl,
      createdAt:   expenses.createdAt,
      // ── join users (บันทึกโดยใคร) ─────────────
      createdByName:  users.name,
      createdByEmail: users.email,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.createdBy, users.id))
    .orderBy(desc(expenses.expenseDate))

  return { success: true, message: 'ok', data: result }
}, {
  tags: ['Finance'], summary: 'ดูรายจ่ายทั้งหมด',
  detail: { security: [{ BearerAuth: [] }] },
  beforeHandle: [requireRole(['admin', 'executive'])],
})