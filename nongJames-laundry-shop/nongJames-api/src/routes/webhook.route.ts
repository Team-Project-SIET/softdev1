import Elysia from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db, customers, oauthAccounts, orders, notifications } from '../db'
import { replyMessage, pushMessage, STATUS_TEXT, verifySignature } from '../services/line.service'

export const webhookRoutes = new Elysia({ prefix: '/webhook' })

  // ── POST /webhook/line ───────────────────────────────────────────────
  // LINE OA ส่ง event มาที่นี่ทุกครั้งที่มีการกระทำใน LINE OA
  // ต้องตั้ง Webhook URL ใน LINE Developers Console เป็น:
  // https://your-domain.com/webhook/line
  .post('/line', async ({ request, set }) => {
    const rawBody  = await request.text()
    const signature = request.headers.get('x-line-signature') || ''

    // ① ตรวจสอบว่า request มาจาก LINE จริง ไม่ใช่คนอื่นปลอม
    if (!verifySignature(rawBody, signature)) {
      set.status = 400
      return { success: false, message: 'Invalid signature' }
    }

    const { events = [] } = JSON.parse(rawBody)
    const WEB_URL = process.env.WEB_URL || 'http://localhost:3000'

    for (const event of events) {
      const lineUserId: string = event.source?.userId
      if (!lineUserId) continue

      // ── Follow Event: ผู้ใช้เพิ่ม LINE OA เป็นเพื่อน ───────────────
      if (event.type === 'follow') {
        await replyMessage(
          event.replyToken,
          `🧺 ยินดีต้อนรับสู่ NongJames Laundry!\n\n` +
          `สั่งซักที่บ้าน ส่งถึงมือ รวดเร็วภายใน 6 ชั่วโมง\n\n` +
          `พิมพ์คำสั่งได้เลยครับ:\n` +
          `• "สถานะ" — เช็คออเดอร์ล่าสุด\n` +
          `• "ออเดอร์" — ดูรายการทั้งหมด\n` +
          `• "ราคา" — ดูราคาบริการ\n\n` +
          `🌐 เว็บไซต์: ${WEB_URL}`
        )
        continue
      }

      // ── Unfollow Event: ผู้ใช้ลบ LINE OA ───────────────────────────
      if (event.type === 'unfollow') {
        console.log(`[LINE Webhook] User unfollowed: ${lineUserId}`)
        continue
      }

      // ── Message Event: ผู้ใช้ส่งข้อความ ────────────────────────────
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim()

        // ② หา user จาก line_user_id ใน oauth_accounts
        // รองรับทุก user ทั้งที่ login ด้วย LINE และ Google
        const oauth = await db.select()
          .from(oauthAccounts)
          .where(eq(oauthAccounts.lineUserId, lineUserId))
          .limit(1)
          .then(r => r[0])

        // ถ้ายังไม่ได้ login/ลงทะเบียน
        if (!oauth) {
          await replyMessage(
            event.replyToken,
            `กรุณาเข้าสู่ระบบด้วย LINE ก่อนนะครับ\n\n` +
            `👉 ${WEB_URL}/login`
          )
          continue
        }

        // หา customer profile
        const customer = await db.select()
          .from(customers)
          .where(eq(customers.userId, oauth.userId))
          .limit(1)
          .then(r => r[0])

        if (!customer) {
          await replyMessage(
            event.replyToken,
            `ไม่พบข้อมูลลูกค้า กรุณาลงทะเบียนที่\n👉 ${WEB_URL}/register`
          )
          continue
        }

        // ③ ประมวลผลข้อความ
        const lowerText = text.toLowerCase()

        // ── "สถานะ" / "status" ─────────────────────────────────────
        if (lowerText.includes('สถานะ') || lowerText.includes('status')) {
          const latestOrder = await db.select()
            .from(orders)
            .where(eq(orders.customerId, customer.id))
            .orderBy(desc(orders.createdAt))
            .limit(1)
            .then(r => r[0])

          if (!latestOrder) {
            await replyMessage(
              event.replyToken,
              `ยังไม่มีออเดอร์ในระบบครับ\n\n` +
              `🌐 สั่งซักได้เลยที่: ${WEB_URL}`
            )
          } else {
            await replyMessage(
              event.replyToken,
              `📋 ออเดอร์ล่าสุดของคุณ\n\n` +
              `หมายเลข: ${latestOrder.orderNumber}\n` +
              `สถานะ: ${STATUS_TEXT[latestOrder.status] || latestOrder.status}\n` +
              `ยอดรวม: ฿${latestOrder.totalAmount}\n\n` +
              `🌐 รายละเอียด: ${WEB_URL}/orders/${latestOrder.id}`
            )
          }
        }

        // ── "ออเดอร์" / "order" ────────────────────────────────────
        else if (lowerText.includes('ออเดอร์') || lowerText.includes('order')) {
          const myOrders = await db.select()
            .from(orders)
            .where(eq(orders.customerId, customer.id))
            .orderBy(desc(orders.createdAt))
            .limit(5)

          if (myOrders.length === 0) {
            await replyMessage(
              event.replyToken,
              `ยังไม่มีออเดอร์ครับ\n\n🌐 ${WEB_URL}`
            )
          } else {
            const list = myOrders
              .map(o => `• ${o.orderNumber} — ${STATUS_TEXT[o.status]}`)
              .join('\n')
            await replyMessage(
              event.replyToken,
              `📋 ออเดอร์ล่าสุด 5 รายการ\n\n${list}\n\n🌐 ดูทั้งหมด: ${WEB_URL}/orders`
            )
          }
        }

        // ── "ราคา" / "price" ───────────────────────────────────────
        else if (lowerText.includes('ราคา') || lowerText.includes('price')) {
          await replyMessage(
            event.replyToken,
            `💰 ราคาบริการ NongJames\n\n` +
            `🧺 ซักพับ        — ฿50/กก.\n` +
            `👔 ซักแห้ง       — ฿150/ชิ้น\n` +
            `🛏 ซักผ้าห่ม    — ฿120/ชิ้น\n` +
            `👟 ซักรองเท้า   — ฿200/คู่\n` +
            `🥻 ซักชุดสูท    — ฿500/ชุด\n\n` +
            `📦 ค่าจัดส่ง ฿60 (ฟรีเมื่อสมัคร Premium)\n\n` +
            `🌐 ดูทั้งหมด: ${WEB_URL}/#services`
          )
        }

        // ── Default Reply ──────────────────────────────────────────
        else {
          await replyMessage(
            event.replyToken,
            `สวัสดีครับ คุณ${customer.name}! 👋\n\n` +
            `พิมพ์คำสั่งได้เลยครับ:\n` +
            `• "สถานะ" — เช็คออเดอร์ล่าสุด\n` +
            `• "ออเดอร์" — ดูรายการทั้งหมด\n` +
            `• "ราคา" — ดูราคาบริการ\n\n` +
            `🌐 ${WEB_URL}`
          )
        }

        // ④ บันทึก log การรับข้อความ
        await db.insert(notifications).values({
          customerId: customer.id,
          orderId:    null,
          type:       'status_update',
          message:    `[LINE Received] ${text}`,
          status:     'sent',
          sentAt:     new Date(),
        }).catch(() => {})
      }
    }

    // LINE ต้องได้รับ 200 OK เสมอ ไม่งั้นจะ retry
    return { success: true }
  }, {
    tags:    ['Webhook'],
    summary: 'LINE OA Webhook — รับ event จาก LINE',
    detail:  { description: 'LINE จะส่ง POST มาที่นี่ทุกครั้งที่มีการกระทำใน LINE OA' },
  })
