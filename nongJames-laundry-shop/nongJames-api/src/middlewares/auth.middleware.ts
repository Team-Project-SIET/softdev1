import Elysia from 'elysia'
import { bearer } from '@elysiajs/bearer'
import { jwt } from '@elysiajs/jwt'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

// Debug: Log SKIP_AUTH at module load time
console.log('[AUTH MODULE] SKIP_AUTH at load:', process.env.SKIP_AUTH)

// ── ประเภทข้อมูลใน JWT Token ──────────────────────────────────────────
// เมื่อ user login → เราเก็บข้อมูลนี้ลงใน token
export type JWTPayload = {
  userId: string
  role: 'admin' | 'staff' | 'driver' | 'executive' | 'customer'
}

// ── Mock User for Development ───────────────────────────────────────────
// Used when SKIP_AUTH=true for testing without tokens
const MOCK_ADMIN_USER: typeof users.$inferSelect = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@laundry.test',
  password: null,
  fullName: 'Development Admin',
  phone: null,
  role: 'ADMIN',
  lineUserId: null,
  lineDisplayName: null,
  linePictureUrl: null,
  address: null,
  city: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  membershipLevel: 'STANDARD',
  membershipExpiryDate: null,
  loyaltyPoints: 0,
  licenseNumber: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ── authPlugin ────────────────────────────────────────────────────────
// Plugin = ปลั๊กที่ติดตั้งเพิ่มความสามารถให้ Elysia
// This plugin:
// 1. Extracts token from Authorization header
// 2. Verifies JWT and fetches user from DB
// 3. Adds { user } to context for all routes
//
// Set SKIP_AUTH=true in .env to bypass authentication (development only)
export const authPlugin = (secret: string) =>
  new Elysia({ name: 'auth-plugin' })
    .use(bearer())
    .use(jwt({ name: 'jwt', secret }))
    .derive(async ({ bearer, jwt, headers, set }) => {
      // Check for SKIP_AUTH environment variable
      if (process.env.SKIP_AUTH === 'true') {
        console.log('[AUTH] Auth Bypassed - SKIP_AUTH=true, using mock ADMIN user')
        // Set a header to indicate mock auth is active (for debugging)
        set.headers['x-mock-auth'] = 'true'
        return { user: MOCK_ADMIN_USER }
      }

      // DEBUG: Log incoming Authorization header
      const authHeader = headers?.authorization
      console.log('[AUTH DEBUG] Authorization header:', authHeader ? `Bearer ${authHeader.replace('Bearer ', '').substring(0, 20)}...` : 'NOT PROVIDED')

      if (!bearer) {
        console.log('[AUTH DEBUG] No bearer token, returning user: null')
        return { user: null as null | typeof users.$inferSelect }
      }

      console.log('[AUTH] Validating Token...')

      try {
        const payload = await jwt.verify(bearer) as JWTPayload | false

        console.log('[AUTH DEBUG] jwt.verify() result:', payload ? `VALID (userId: ${payload.userId})` : 'INVALID (false)')
        if (payload) {
          console.log('[AUTH DEBUG] Full payload:', JSON.stringify(payload))
        }

        if (!payload) {
          console.log('[AUTH DEBUG] Token verification returned false, returning user: null')
          return { user: null as null | typeof users.$inferSelect }
        }

        // Fetch user from DB
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.userId))
          .limit(1)
          .then(r => r[0] ?? null)

        return { user }

      } catch (error) {
        console.log('[AUTH DEBUG] jwt.verify() ERROR:', error instanceof Error ? error.message : error)
        return { user: null as null | typeof users.$inferSelect }
      }
    })

// ── Guard Functions ────────────────────────────────────────────────────
// Guard = ฟังก์ชันที่ใช้กับ beforeHandle เพื่อป้องกัน route
// ถ้า return อะไรก็ตาม = หยุด request นั้น และส่งผลลัพธ์นั้นกลับไป
// ถ้าไม่ return อะไร = ผ่านไป route handler ต่อได้
//
// IMPORTANT: beforeHandle runs BEFORE derive hooks in Elysia!
// So ctx.user from authPlugin won't be available yet in beforeHandle.
// We use a workaround by checking SKIP_AUTH here.

// requireAuth — บังคับว่าต้อง login ก่อน
export const requireAuth = (ctx: any) => {
  console.log('[AUTH DEBUG] requireAuth called, SKIP_AUTH=', process.env.SKIP_AUTH)

  // Skip auth check in development mode - set mock user and allow request
  if (process.env.SKIP_AUTH === 'true') {
    console.log('[AUTH] requireAuth: Bypassed (SKIP_AUTH=true), setting mock ADMIN user')
    // IMPORTANT: Mutate ctx to set the user for downstream use
    Object.defineProperty(ctx, 'user', {
      value: MOCK_ADMIN_USER,
      writable: true,
      configurable: true
    })
    console.log('[AUTH DEBUG] Mock user set in ctx:', ctx.user ? ctx.user.email : 'FAILED')
    return undefined // Return undefined to continue to route handler
  }

  console.log('[AUTH DEBUG] requireAuth called, user:', ctx.user ? `EXISTS (id: ${ctx.user.id})` : 'NULL')
  if (!ctx.user) {
    console.log('[AUTH DEBUG] Returning 401 - Unauthorized')
    ctx.set.status = 401
    return { success: false, message: 'กรุณา Login ก่อนใช้งาน', data: null }
  }
}

// requireRole — บังคับ role ที่เฉพาะเจาะจง
// ใช้แบบนี้: beforeHandle: [requireRole(['ADMIN', 'STAFF'])]
export const requireRole = (allowedRoles: string[]) => {
  console.log(`[AUTH DEBUG] requireRole factory called for roles: [${allowedRoles.join(', ')}]`)
  return (ctx: any) => {
    console.log(`[AUTH DEBUG] requireRole guard called, SKIP_AUTH=${process.env.SKIP_AUTH}, user=`, ctx.user ? ctx.user.id : 'null')

    // Skip role check in development mode - set mock user and allow request
    if (process.env.SKIP_AUTH === 'true') {
      console.log(`[AUTH] requireRole [${allowedRoles.join(', ')}]: Bypassed (SKIP_AUTH=true), setting mock ADMIN user`)
      // IMPORTANT: Mutate ctx to set the user for downstream use
      Object.defineProperty(ctx, 'user', {
        value: MOCK_ADMIN_USER,
        writable: true,
        configurable: true
      })
      console.log('[AUTH DEBUG] Mock user set in ctx:', ctx.user ? ctx.user.email : 'FAILED')
      return undefined // Return undefined to continue to route handler
    }

    if (!ctx.user) {
      ctx.set.status = 401
      return { success: false, message: 'กรุณา Login ก่อนใช้งาน', data: null }
    }
    if (!allowedRoles.includes(ctx.user.role)) {
      ctx.set.status = 403
      return {
        success: false,
        message: `ไม่มีสิทธิ์ — ต้องเป็น ${allowedRoles.join(' หรือ ')}`,
        data: null
      }
    }
  }
}
