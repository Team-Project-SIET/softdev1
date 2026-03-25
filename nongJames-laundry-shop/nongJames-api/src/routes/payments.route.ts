import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db, payments, orders } from '../db'
import { authPlugin, requireRole, requireAuth } from '../middlewares/auth.middleware'

const generatePromptPayPayload = (phone: string, amount: number) =>
  `PromptPay:${phone}:${amount.toFixed(2)}`

export const paymentRoutes = new Elysia({ prefix: '/payments' })
  .use(authPlugin(process.env.JWT_SECRET!))

  .get('/order/:orderId', async ({ params }) => {
    const result = await db.select().from(payments)
      .where(eq(payments.orderId, params.orderId))
    return { success: true, message: 'ok', data: result }
  }, {
    tags:    ['Payments'],
    summary: 'ดูประวัติการชำระเงินของ Order',
    detail:  {
      description: '**Role:** ทุกคนที่ login',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireAuth],
    params: t.Object({ orderId: t.String({ description: 'Order UUID' }) }),
  })

  .post('/qr', async ({ body, set }) => {
    const order = await db.select().from(orders)
      .where(eq(orders.id, body.orderId)).limit(1).then(r => r[0])
    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order', data: null }
    }
    const amount  = Number(order.totalAmount)
    const payload = generatePromptPayPayload(process.env.PROMPTPAY_PHONE!, amount)
    const [payment] = await db.insert(payments).values({
      orderId: body.orderId, amount: order.totalAmount,
      method: 'promptpay_qr', status: 'pending',
    }).returning()
    set.status = 201
    return {
      success: true, message: 'สร้าง QR สำเร็จ',
      data: { paymentId: payment.id, amount, promptPayPayload: payload },
    }
  }, {
    tags:    ['Payments'],
    summary: 'สร้าง PromptPay QR Code',
    detail:  {
      description: `**Role:** ทุกคนที่ login

เอา \`promptPayPayload\` ที่ได้ไปแปลงเป็น QR image ที่ Frontend
แนะนำใช้ library: \`react-qr-code\` หรือ \`qrcode\``,
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireAuth],
    body: t.Object({
      orderId: t.String({ description: 'Order UUID ที่ต้องการชำระ' }),
    }),
  })

  .patch('/:id/confirm', async ({ params, body }) => {
    const payment = await db.select().from(payments)
      .where(eq(payments.id, params.id)).limit(1).then(r => r[0])
    if (!payment) return { success: false, message: 'ไม่พบ Payment', data: null }
    await db.update(payments)
      .set({ status: 'success', slipImageUrl: body.slipImageUrl ?? null, paidAt: new Date() })
      .where(eq(payments.id, params.id))
    await db.update(orders).set({ paymentStatus: 'paid' })
      .where(eq(orders.id, payment.orderId))
    return { success: true, message: 'Confirm การชำระเงินสำเร็จ', data: null }
  }, {
    tags:    ['Payments'],
    summary: 'Admin Confirm รับเงินแล้ว',
    detail:  {
      description: '**Role:** admin, staff\n\nกด confirm หลังเห็น slip จากลูกค้า',
      security: [{ BearerAuth: [] }],
    },
    beforeHandle: [requireRole(['admin', 'staff'])],
    params: t.Object({ id: t.String({ description: 'Payment UUID' }) }),
    body: t.Object({
      slipImageUrl: t.Optional(t.String({ description: 'URL รูป slip (optional)' }
