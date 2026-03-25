import Elysia, { t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import {
  orders, orderItems,
  orderStatusHistory, customers, users
} from '../db/schema'
import { authPlugin, requireAuth, requireRole } from '../middlewares/auth.middleware'

const JWT_SECRET = process.env.JWT_SECRET!

export const orderRoutes = new Elysia({ prefix: '/orders' })
  .use(authPlugin(JWT_SECRET))

  // ── GET /orders ─────────────────────────────────────────────────────
  // ดูรายการ Order ทั้งหมด (Admin / Staff เท่านั้น)
  //
  // beforeHandle = middleware ที่รัน "ก่อน" handler นี้
  // requireRole(['admin', 'staff']) → ถ้า role ไม่ตรง → return 403 ทันที
  .get('/', async () => {
    const result = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt)) // เรียงจากใหม่ → เก่า

    return { success: true, message: 'ok', data: result }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
  })

  // ── GET /orders/my ──────────────────────────────────────────────────
  // Customer ดู orders ของตัวเอง
  // * ต้องวางก่อน /:id เพราะ Elysia จะ match "my" เป็น id แทน
  .get('/my', async ({ store, set }) => {
    const user = (store as any)?.user
    if (!user) return set.status = 401

    // หา customer profile ของ user นี้
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.userId))
      .limit(1)
      .then(r => r[0])

    if (!customer) {
      set.status = 404
      return { success: false, message: 'ไม่พบข้อมูลลูกค้า', data: null }
    }

    const myOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customer.id))
      .orderBy(desc(orders.createdAt))

    return { success: true, message: 'ok', data: myOrders }
  }, {
    beforeHandle: [requireAuth],
  })

  // ── GET /orders/:id ─────────────────────────────────────────────────
  // ดู Order รายละเอียด + items
  // :id = dynamic parameter เช่น /orders/abc-123
  .get('/:id', async ({ params, set }) => {
    // ① ดึง order หลัก
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order นี้', data: null }
    }

    // ② ดึง items ทั้งหมดใน order นั้น
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, params.id))

    // ③ รวม order + items ส่งกลับ
    return { success: true, message: 'ok', data: { ...order, items } }
  }, {
    beforeHandle: [requireAuth],
    params: t.Object({ id: t.String() }),
  })

  // ── POST /orders ────────────────────────────────────────────────────
  // Admin/Staff สร้าง Order ใหม่
  //
  // body = ข้อมูลที่ Frontend ส่งมาใน request body (JSON)
  // t.Object() = validate รูปแบบข้อมูล ถ้าผิดจะ error 422 อัตโนมัติ
  .post('/', async ({ body, store, set }) => {
    const user = (store as any)?.user
    if (!user) return set.status = 401

    const { customerId, orderType, pickupAddress, deliveryAddress, items } = body

    // ① คำนวณราคารวมจาก items ทั้งหมด
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    // ② สร้าง order number format: NJ-YYYYMMDD-XXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq     = Math.floor(Math.random() * 900 + 100) // 100-999
    const orderNumber = `NJ-${dateStr}-${seq}`

    // ③ สร้าง order ใน database
    // .returning() = ให้ return ข้อมูลที่เพิ่งสร้างกลับมา
    const [newOrder] = await db.insert(orders).values({
      orderNumber,
      customerId,
      createdBy:       user.userId,
      orderType,
      pickupAddress:   pickupAddress ?? null,
      deliveryAddress: deliveryAddress ?? null,
      totalAmount:     totalAmount.toString(),
      status:          'PENDING_PICKUP',
      paymentStatus:   'PENDING',
    } as any).returning()

    // ④ สร้าง order items (loop สร้างทีละรายการ)
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map(i => ({
          orderId:    newOrder.id,
          serviceId:  i.serviceId,
          quantity:   i.quantity,
          unitPrice:  i.unitPrice.toString(),
          totalPrice: (i.quantity * i.unitPrice).toString(),
        }))
      )
    }

    // ⑤ บันทึก log ว่าสร้าง order แล้ว
    await db.insert(orderStatusHistory).values({
      orderId:  newOrder.id,
      changedBy: user.userId,
      toStatus: 'PENDING_PICKUP',
      notes:    'Order created by staff',
    })

    set.status = 201
    return { success: true, message: 'สร้าง Order สำเร็จ', data: newOrder }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
    body: t.Object({
      customerId:      t.String(),
      orderType:       t.Union([t.Literal('B2C'), t.Literal('B2B')]),
      pickupAddress:   t.Optional(t.String()),
      deliveryAddress: t.Optional(t.String()),
      items: t.Array(t.Object({
        serviceId: t.String(),
        quantity:  t.Number(),
        unitPrice: t.Number(),
      })),
    }),
  })

  // ── PATCH /orders/:id/status ────────────────────────────────────────
  // เปลี่ยนสถานะ Order
  // Admin/Staff/Driver ทำได้ แต่ Driver ทำได้แค่บางสถานะ
  .patch('/:id/status', async ({ params, body, store, set }) => {
    const user = (store as any)?.user
    if (!user) return set.status = 401

    const { status, note } = body

    // ① เช็คว่า order มีอยู่จริง
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
      .limit(1)
      .then(r => r[0])

    if (!order) {
      set.status = 404
      return { success: false, message: 'ไม่พบ Order', data: null }
    }

    // ② อัปเดตสถานะ
    await db
      .update(orders)
      .set({ status, updatedAt: new Date() } as any)
      .where(eq(orders.id, params.id))

    // ③ บันทึก log ทุกครั้งที่สถานะเปลี่ยน
    // ประโยชน์: ดูได้ว่าใครเปลี่ยน เมื่อไหร่ จาก/ไปสถานะไหน
    await db.insert(orderStatusHistory).values({
      orderId:   params.id,
      changedBy: user.userId,
      status,
      note:      note ?? null,
    } as any)

    // TODO: ส่ง LINE push notification ให้ลูกค้าในขั้นตอนถัดไป
    // await lineService.pushStatusUpdate(order.customerId, status)

    return { success: true, message: `อัปเดตสถานะเป็น ${status} แล้ว`, data: null }
  }, {
    beforeHandle: [requireRole(['ADMIN', 'STAFF', 'DRIVER'])],
    params: t.Object({ id: t.String() }),
    body: t.Object({
      // Union = รับได้แค่ค่าที่กำหนด ป้องกัน typo
      status: t.Union([
        t.Literal('PENDING_PICKUP'),
        t.Literal('WASHING'),
        t.Literal('PACKING'),
        t.Literal('READY_FOR_DELIVERY'),
        t.Literal('COMPLETED'),
        t.Literal('CANCELLED'),
      ]),
      note: t.Optional(t.String()),
    }),
  })
