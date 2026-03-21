import Elysia, { t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import {
  db, orders, orderItems,
  orderStatusHistory, customers, users
} from '../db'
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
    beforeHandle: [requireRole(['admin', 'staff'])],
  })

  // ── GET /orders/my ──────────────────────────────────────────────────
  // Customer ดู orders ของตัวเอง
  // * ต้องวางก่อน /:id yokan Elysia จะ match "my" เป็น id แทน
  .get('/my', async ({ user, set }) => {
    if (!user) return set.status = 401

    // หา customer profile ของ user นี้
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
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
  .post('/', async ({ body, user, set }) => {
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
      createdBy:       user!.id,
      orderType,
      pickupAddress:   pickupAddress ?? null,
      deliveryAddress: deliveryAddress ?? null,
      totalAmount:     totalAmount.toString(),
      status:          'pending_pickup',
      paymentStatus:   'pending',
    }).returning()

    // ④ สร้าง order items (loop สร้างทีละรายการ)
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map(i => ({
          orderId:   newOrder.id,
          serviceId: i.serviceId,
          quantity:  i.quantity.toString(),
          unitPrice: i.unitPrice.toString(),
          subtotal:  (i.quantity * i.unitPrice).toString(),
        }))
      )
    }

    // ⑤ บันทึก log ว่าสร้าง order แล้ว
    await db.insert(orderStatusHistory).values({
      orderId:   newOrder.id,
      changedBy: user!.id,
      status:    'pending_pickup',
      note:      'Order created by staff',
    })

    set.status = 201
    return { success: true, message: 'สร้าง Order สำเร็จ', data: newOrder }
  }, {
    beforeHandle: [requireRole(['admin', 'staff'])],
    body: t.Object({
      customerId:      t.String(),
      orderType:       t.Union([t.Literal('b2c'), t.Literal('b2b')]),
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
  .patch('/:id/status', async ({ params, body, user, set }) => {
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
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, params.id))

    // ③ บันทึก log ทุกครั้งที่สถานะเปลี่ยน
    // ประโยชน์: ดูได้ว่าใครเปลี่ยน เมื่อไหร่ จาก/ไปสถานะไหน
    await db.insert(orderStatusHistory).values({
      orderId:   params.id,
      changedBy: user!.id,
      status,
      note:      note ?? null,
    })

    // TODO: ส่ง LINE push notification ให้ลูกค้าในขั้นตอนถัดไป
    // await lineService.pushStatusUpdate(order.customerId, status)

    return { success: true, message: `อัปเดตสถานะเป็น ${status} แล้ว`, data: null }
  }, {
    beforeHandle: [requireRole(['admin', 'staff', 'driver'])],
    params: t.Object({ id: t.String() }),
    body: t.Object({
      // Union = รับได้แค่ค่าที่กำหนด ป้องกัน typo
      status: t.Union([
        t.Literal('pending_pickup'),
        t.Literal('washing'),
        t.Literal('packing'),
        t.Literal('ready_for_delivery'),
        t.Literal('completed'),
        t.Literal('cancelled'),
      ]),
      note: t.Optional(t.String()),
    }),
  })
