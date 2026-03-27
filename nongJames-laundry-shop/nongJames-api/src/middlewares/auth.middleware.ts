import Elysia from 'elysia'
import { bearer } from '@elysiajs/bearer'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../utils/jwt'

export const authPlugin = () =>
  new Elysia({ name: 'auth-plugin' })
    .use(bearer())
    .derive(async ({ bearer }) => {
      if (!bearer) return { user: null as any }
      try {
        const payload = await verifyToken(bearer)
        if (!payload || !payload.userId) return { user: null as any }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.userId))
          .limit(1)
          .then(r => r[0] ?? null)

        return { user }
      } catch {
        return { user: null as any }
      }
    })

export const requireAuth = ({ user, set }: any) => {
  if (!user) {
    set.status = 401
    return { success: false, message: 'กรุณา Login ก่อนใช้งาน', data: null }
  }
}

export const requireRole = (roles: string[]) => {
  return ({ user, set }: any) => {
    if (!user) {
      set.status = 401
      return { success: false, message: 'กรุณา Login', data: null }
    }
    if (!roles.includes(user.role)) {
      set.status = 403
      return { success: false, message: 'ไม่มีสิทธิ์', data: null }
    }
  }
}
