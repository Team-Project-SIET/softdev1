import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db, payments, orders } from '../db'
import { authPlugin, requireRole, requireAuth } from '../middlewares/auth.middleware'

// ── Helper: สร้าง PromptPay payload ──────────────────────────────────
// PromptPay QR ใช้มาตรฐาน EMVCo QR Code
// เราสร้าง payload string แล้วเอาไปแปลงเป็น QR image ที่ Frontend
const generatePromptPayPayload = (phoneOrId: string, amount: number): string => {
  // PromptPay payload format (simplified)
  // จริงๆ ต้องคำนวณ CRC16 checksum ด้วย
  // แนะนำใช้ library: promptpay-qr
  const amountStr = amount.toFixed(2)
  return `PromptPay:${phoneOrId}:${amountStr}`
}

export const paymentRoutes = new Elysia({ prefix: '/payments' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── GET /payments/order/:orderId ─────────────────────────────────────
  // ดูประวัติการชำระเงินของ order นั้น
  .get('/order/:orderId', async ({ params, set }) => {
    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, params.orderId))

    return { success: true, message: 'ok', data: orderPayments }
  }, {
    beforeHandle: [requireAuth],
    params: t.Object({ orderId: t.String() }),
  })

  // ── POST /payments/qr ─────────────────────────────────────────────────
  // สร้าง PromptPay QR สำหรับชำระเงิน
  //
  // Flow:
  // 1. Frontend ขอ QR จาก API
  // 2. API สร้าง payment record (status: pending)
  // 3. API return payload ให้ Frontend แปลงเป็น QR image
  // 4. ลูกค้าสแกน QR จ่ายเงิน
  // 5. Admin กด confirm (PATCH /payments/:id/confirm)
  .post('/qr', async ({ body, set }) => {
    // ตรวจว่า order มีอยู่
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, body.orderId))
      .limit(1)
      .then(r => r[0])

    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order', data: null }
    }

    // สร้าง PromptPay payload
    const promptPayPhone = process.env.PROMPTPAY_PHONE! // เบอร์ร้าน NJ
    const amount = Number(order.totalAmount)
    const payload = generatePromptPayPayload(promptPayPhone, amount)

    // บันทึก payment record (status ยังเป็น pending)
    const [payment] = await db
      .insert(payments)
      .values({
        orderId:  body.orderId,
        amount:   order.totalAmount,
        method:   'promptpay_qr',
        status:   'pending',
      })
      .returning()

    set.status = 201
    return {
      success: true,
      message: 'สร้าง QR สำเร็จ',
      data: {
        paymentId: payment.id,
        amount,
        // payload นี้เอาไปแปลงเป็น QR image ที่ Frontend
        // ใช้ library: qrcode หรือ react-qr-code
        promptPayPayload: payload,
      }
    }
  }, {
    beforeHandle: [requireAuth],
    body: t.Object({
      orderId: t.String(),
    }),
  })

  // ── PATCH /payments/:id/confirm ──────────────────────────────────────
  // Admin กด confirm ว่าได้รับเงินแล้ว (หลังเห็น slip)
  .patch('/:id/confirm', async ({ params, body, set }) => {
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!payment) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Payment', data: null }
    }

    // อัปเดต payment เป็น success
    await db
      .update(payments)
      .set({
        status:       'success',
        slipImageUrl: body.slipImageUrl ?? null,
        paidAt:       new Date(),
      })
      .where(eq(payments.id, params.id))

    // อัปเดต order ว่าชำระแล้ว
    await db
      .update(orders)
      .set({ paymentStatus: 'paid' })
      .where(eq(orders.id, payment.orderId))

    return { success: true, message: 'Confirm การชำระเงินสำเร็จ', data: null }
  }, {
    beforeHandle: [requireRole(['admin', 'staff'])],
    params: t.Object({ id: t.String() }),
    body: t.Object({
      slipImageUrl: t.Optional(t.String()),
    }),
  })
