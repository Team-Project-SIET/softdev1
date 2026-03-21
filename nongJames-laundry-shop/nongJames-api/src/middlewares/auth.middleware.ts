import Elysia from 'elysia'
import { bearer } from '@elysiajs/bearer'
import { jwt } from '@elysiajs/jwt'
import { db, users } from '../db.ts'
import { eq } from 'drizzle-orm'

// ── ประเภทข้อมูลใน JWT Token ──────────────────────────────────────────
// เมื่อ user login → เราเก็บข้อมูลนี้ลงใน token
export type JWTPayload = {
  userId: string
  role: 'admin' | 'staff' | 'driver' | 'executive' | 'customer'
}

// ── authPlugin ────────────────────────────────────────────────────────
// Plugin = ปลั๊กที่ติดตั้งเพิ่มความสามารถให้ Elysia
// authPlugin ทำ 2 อย่าง:
// 1. ดึง token จาก Authorization header
// 2. แปลง token → ข้อมูล user แล้วแนบเข้า context
//
// หลังจากใช้ plugin นี้ ทุก route จะมี `ctx.user` ใช้งานได้เลย
export const authPlugin = (secret: string) =>
  new Elysia({ name: 'auth-plugin' })
    .use(bearer())
    .use(jwt({ name: 'jwt', secret }))
    .derive(async ({ bearer, jwt }) => {
      // bearer = token ที่ส่งมาใน Authorization: Bearer <token>

      if (!bearer) {
        // ไม่มี token → user เป็น null (ยังไม่ได้ login)
        return { user: null as null | typeof users.$inferSelect }
      }

      try {
        // verify() = ตรวจว่า token ถูกต้องและไม่หมดอายุ
        const payload = await jwt.verify(bearer) as JWTPayload | false

        if (!payload) {
          // token ไม่ valid
          return { user: null as null | typeof users.$inferSelect }
        }

        // ดึงข้อมูล user จาก DB ด้วย userId ที่อยู่ใน token
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.userId))
          .limit(1)
          .then(r => r[0] ?? null)

        return { user }

      } catch {
        return { user: null as null | typeof users.$inferSelect }
      }
    })

// ── Guard Functions ────────────────────────────────────────────────────
// Guard = ฟังก์ชันที่ใช้กับ beforeHandle เพื่อป้องกัน route
// ถ้า return อะไรก็ตาม = หยุด request นั้น และส่งผลลัพธ์นั้นกลับไป
// ถ้าไม่ return อะไร = ผ่านไป route handler ต่อได้

// requireAuth — บังคับว่าต้อง login ก่อน
export const requireAuth = ({ user, set }: any) => {
  if (!user) {
    set.status = 401
    return { success: false, message: 'กรุณา Login ก่อนใช้งาน', data: null }
  }
}

// requireRole — บังคับ role ที่เฉพาะเจาะจง
// ใช้แบบนี้: beforeHandle: [requireRole(['admin', 'staff'])]
export const requireRole = (allowedRoles: string[]) => {
  return ({ user, set }: any) => {
    if (!user) {
      set.status = 401
      return { success: false, message: 'กรุณา Login ก่อนใช้งาน', data: null }
    }
    if (!allowedRoles.includes(user.role)) {
      set.status = 403
      return {
        success: false,
        message: `ไม่มีสิทธิ์ — ต้องเป็น ${allowedRoles.join(' หรือ ')}`,
        data: null
      }
    }
  }
}
