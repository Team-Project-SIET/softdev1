import Elysia, { t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { notifications, customers, oauthAccounts } from '../db/schema'
import { authPlugin, requireRole } from '../middlewares/auth.middleware'

// ── Helper: ส่ง LINE Push Message ─────────────────────────────────────
// LINE Messaging API docs:
// https://developers.line.biz/en/reference/messaging-api/
const sendLineMessage = async (lineUserId: string, message: string) => {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      // Channel Access Token จาก LINE Developers Console
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`LINE API error: ${JSON.stringify(err)}`)
  }

  return await res.json() as any
}

// ── Template Messages ─────────────────────────────────────────────────
// เก็บ template message แต่ละสถานะไว้ที่เดียว แก้ง่าย
export const STATUS_MESSAGES: Record<string, string> = {
  pending_pickup:     '🚗 NJ Laundry: เราได้รับ Order ของคุณแล้ว กำลังส่งคนมารับผ้า',
  washing:            '🫧 NJ Laundry: ผ้าของคุณกำลังซักอยู่นะครับ',
  packing:            '📦 NJ Laundry: ซักเสร็จแล้ว กำลังแพ็คเพื่อจัดส่ง',
  ready_for_delivery: '🚚 NJ Laundry: กำลังส่งผ้าคืนให้คุณแล้ว!',
  completed:          '✅ NJ Laundry: ส่งคืนเรียบร้อยแล้วครับ ขอบคุณที่ใช้บริการ 🙏',
  cancelled:          '❌ NJ Laundry: Order ของคุณถูกยกเลิก กรุณาติดต่อร้านเพื่อสอบถาม',
}

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  .use(authPlugin(process.env.JWT_SECRET!))

  // ── POST /notifications/status-update ───────────────────────────────
  // ส่ง LINE notification เมื่อสถานะ order เปลี่ยน
  // เรียกจาก orders.route.ts หลัง PATCH /orders/:id/status
  .post('/status-update', async ({ body, set }) => {
    const { customerId, status, orderId } = body

    // หา LINE user ID ของลูกค้า
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)
      .then(r => r[0])

    if (!customer || !customer.userId) {
      set.status = 404
      return { success: false, message: 'ไม่พบลูกค้า', data: null }
    }

    const oauthAcc = await db
      .select()
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, customer.userId))
      .limit(1)
      .then(r => r[0])

    // ถ้าไม่มี LINE user ID หมายความว่า login ด้วย Google
    // ยังส่ง LINE ไม่ได้
    if (!oauthAcc?.lineUserId) {
      return {
        success: false,
        message: 'ลูกค้าไม่ได้ใช้ LINE Login จึงส่ง notification ไม่ได้',
        data: null
      }
    }

    const message = STATUS_MESSAGES[status] ?? `อัปเดตสถานะเป็น: ${status}`

    try {
      // ส่ง LINE message จริง
      const lineRes = await sendLineMessage(oauthAcc.lineUserId, message)

      // บันทึก log ทุกครั้งที่ส่ง
      const [noti] = await db
        .insert(notifications)
        .values({
          userId: customer.userId,
          orderId: orderId ?? null,
          type: 'ORDER_STATUS_UPDATED',
          channel: 'LINE_OA',
          title: `Order Status Update`,
          message,
          lineMessageId: lineRes?.sentMessages?.[0]?.id ?? null,
          isSent: true,
          sentAt: new Date(),
        } as any)
        .returning()

      return { success: true, message: 'ส่ง notification สำเร็จ', data: noti }

    } catch (err: any) {
      // ถ้าส่งไม่สำเร็จ บันทึก status เป็น failed
      await db.insert(notifications).values({
        userId: customer.userId,
        orderId: orderId ?? null,
        type: 'ORDER_STATUS_UPDATED',
        channel: 'LINE_OA',
        title: `Order Status Update Failed`,
        message,
        isSent: false,
        failureReason: err.message,
      } as any)

      console.error('[LINE Push Error]', err.message)
      set.status = 500
      return { success: false, message: 'ส่ง LINE notification ไม่สำเร็จ', data: null }
    }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    body: t.Object({
      customerId: t.String(),
      status:     t.String(),
      orderId:    t.Optional(t.String()),
    }),
  })

  // ── GET /notifications/:customerId ──────────────────────────────────
  // ดูประวัติ notifications ของลูกค้า
  .get('/:customerId', async ({ params }) => {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, params.customerId))
      .orderBy(desc(notifications.createdAt))

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    params: t.Object({ customerId: t.String() }),
  })
