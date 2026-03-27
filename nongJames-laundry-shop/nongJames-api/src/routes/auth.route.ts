import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db, users, customers, oauthAccounts } from '../db'
import { authPlugin, requireAuth } from '../middlewares/auth.middleware'
import { signToken } from '../utils/jwt'

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authPlugin())

  .get('/me', ({ user, set }) => {
    if (!user) {
      set.status = 401
      return { success: false, message: 'ยังไม่ได้ Login', data: null }
    }
    return { success: true, message: 'ok', data: user }
  }, {
    tags: ['Auth'], summary: 'ดูข้อมูล user',
    detail: { security: [{ BearerAuth: [] }] },
  })

  // LINE OAuth ────────────────────────────────────────────────────────
  .get('/line', () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.LINE_CLIENT_ID!,
      redirect_uri:  process.env.LINE_REDIRECT_URI!,
      scope:         'profile openid',
      state:         crypto.randomUUID(),
    })
    return Response.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`, 302)
  }, { tags: ['Auth'], summary: 'LINE OAuth2 Login' })

  .get('/line/callback', async ({ query }) => {
    const { code } = query
    if (!code) return Response.redirect(`${WEB_URL}/login?error=no_code`, 302)
    try {
      const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code,
          redirect_uri:  process.env.LINE_REDIRECT_URI!,
          client_id:     process.env.LINE_CLIENT_ID!,
          client_secret: process.env.LINE_CLIENT_SECRET!,
        }),
      })
      const tokenData = await tokenRes.json() as any

      const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any

      let user = await db.select().from(users)
        .where(eq(users.email, `${profile.userId}@line.njlaundry`))
        .limit(1).then(r => r[0])

      if (!user) {
        ;[user] = await db.insert(users).values({
          name: profile.displayName,
          email: `${profile.userId}@line.njlaundry`,
          role: 'customer',
        }).returning()
        await db.insert(customers).values({ userId: user.id, name: profile.displayName, type: 'b2c' })
      }

      const existing = await db.select().from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id)).limit(1).then(r => r[0])
      if (existing) {
        await db.update(oauthAccounts)
          .set({ lineUserId: profile.userId, accessToken: tokenData.access_token })
          .where(eq(oauthAccounts.userId, user.id))
      } else {
        await db.insert(oauthAccounts).values({
          userId: user.id, provider: 'line',
          providerAccountId: profile.userId,
          lineUserId: profile.userId,
          accessToken: tokenData.access_token,
        })
      }

      const token    = await signToken({ userId: user.id, role: user.role })  // ← jose sign
      const userJson = encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }))
      return Response.redirect(`${WEB_URL}/auth/callback?token=${token}&user=${userJson}`, 302)

    } catch (err) {
      console.error('[LINE Error]', err)
      return Response.redirect(`${WEB_URL}/login?error=line_failed`, 302)
    }
  }, {
    tags: ['Auth'], summary: 'LINE Callback',
    query: t.Object({ code: t.Optional(t.String()), state: t.Optional(t.String()) }),
  })

  // Google OAuth ──────────────────────────────────────────────────────
  .get('/google', () => {
    const params = new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope:         'email profile',
      access_type:   'offline',
    })
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302)
  }, { tags: ['Auth'], summary: 'Google OAuth2 Login' })

  .get('/google/callback', async ({ query }) => {
    const { code } = query
    if (!code) return Response.redirect(`${WEB_URL}/login?error=no_code`, 302)
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code, grant_type: 'authorization_code',
          client_id:     process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
        }),
      })
      const tokenData = await tokenRes.json() as any

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any

      let user = await db.select().from(users)
        .where(eq(users.email, profile.email))
        .limit(1).then(r => r[0])

      if (!user) {
        ;[user] = await db.insert(users).values({ name: profile.name, email: profile.email, role: 'customer' }).returning()
        await db.insert(customers).values({ userId: user.id, name: profile.name, type: 'b2c' })
      }

      const existing = await db.select().from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id)).limit(1).then(r => r[0])
      if (existing) {
        await db.update(oauthAccounts).set({ accessToken: tokenData.access_token }).where(eq(oauthAccounts.userId, user.id))
      } else {
        await db.insert(oauthAccounts).values({
          userId: user.id, provider: 'google',
          providerAccountId: profile.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
        })
      }

      const token    = await signToken({ userId: user.id, role: user.role })  // ← jose sign
      const userJson = encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }))
      return Response.redirect(`${WEB_URL}/auth/callback?token=${token}&user=${userJson}`, 302)

    } catch (err) {
      console.error('[Google Error]', err)
      return Response.redirect(`${WEB_URL}/login?error=google_failed`, 302)
    }
  }, {
    tags: ['Auth'], summary: 'Google Callback',
    query: t.Object({ code: t.Optional(t.String()), state: t.Optional(t.String()) }),
  })

  // Dev Login ─────────────────────────────────────────────────────────
  .post('/dev-login', async ({ body, set }) => {
    const user = await db.select().from(users)
      .where(eq(users.email, body.email))
      .limit(1).then(r => r[0])

    if (!user) {
      set.status = 404
      return { success: false, message: `ไม่พบ: ${body.email}`, data: null }
    }

    const token = await signToken({ userId: user.id, role: user.role })  // ← jose sign
    return { success: true, message: `Login: ${user.role}`, data: { token, user } }
  }, {
    tags: ['Auth'], summary: '⚠️ Dev Only',
    body: t.Object({ email: t.String() }),
  })

  // Register ──────────────────────────────────────────────────────────
  .post('/register', async ({ body, set }) => {
    const existing = await db.select().from(users)
      .where(eq(users.email, body.email)).limit(1).then(r => r[0])
    if (existing) {
      set.status = 409
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว', data: null }
    }

    const passwordHash = await Bun.password.hash(body.password, { algorithm: 'bcrypt', cost: 10 })
    const [user] = await db.insert(users).values({
      name: body.name, email: body.email, passwordHash, role: 'customer',
    }).returning()

    await db.insert(customers).values({ userId: user.id, name: body.name, phone: body.phone || null, type: 'b2c' }).catch(() => {})

    const token = await signToken({ userId: user.id, role: user.role })
    set.status = 201
    return {
      success: true, message: 'สมัครสมาชิกสำเร็จ',
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    }
  }, {
    tags: ['Auth'], summary: 'Register',
    body: t.Object({
      name:     t.String({ minLength: 2 }),
      email:    t.String({ format: 'email' }),
      password: t.String({ minLength: 8 }),
      phone:    t.Optional(t.String()),
    }),
  })

  // Login ─────────────────────────────────────────────────────────────
  .post('/login', async ({ body, set }) => {
    const user = await db.select().from(users)
      .where(eq(users.email, body.email)).limit(1).then(r => r[0])
    if (!user) {
      set.status = 401
      return { success: false, message: 'ไม่พบบัญชีนี้ในระบบ', data: null }
    }
    if (!user.passwordHash) {
      set.status = 401
      return { success: false, message: 'บัญชีนี้ใช้ LINE/Google Login', data: null }
    }
    const isValid = await Bun.password.verify(body.password, user.passwordHash)
    if (!isValid) {
      set.status = 401
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง', data: null }
    }
    const token = await signToken({ userId: user.id, role: user.role })
    return {
      success: true, message: 'เข้าสู่ระบบสำเร็จ',
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    }
  }, {
    tags: ['Auth'], summary: 'Login',
    body: t.Object({ email: t.String({ format: 'email' }), password: t.String({ minLength: 1 }) }),
  })

  // Profile ───────────────────────────────────────────────────────────
  .get('/profile', async ({ user, set }) => {
    if (!user) { set.status = 401; return { success: false, message: 'Unauthorized', data: null } }
    const customer = await db.select().from(customers)
      .where(eq(customers.userId, user.id)).limit(1).then(r => r[0])
    return { success: true, data: { ...user, phone: customer?.phone, address: customer?.address } }
  }, {
    tags: ['Auth'], summary: 'ดึง Profile',
    detail: { security: [{ BearerAuth: [] }] },
    beforeHandle: [requireAuth],
  })

  .patch('/profile', async ({ body, user, set }) => {
    if (!user) { set.status = 401; return { success: false, message: 'Unauthorized', data: null } }
    if (body.name) {
      await db.update(users).set({ name: body.name, updatedAt: new Date() }).where(eq(users.id, user.id))
    }
    const address = [body.houseNo, body.building, body.road && `ถนน${body.road}`,
      body.subDistrict && `แขวง${body.subDistrict}`, body.district && `เขต${body.district}`, body.province]
      .filter(Boolean).join(' ') || null

    const customer = await db.select().from(customers)
      .where(eq(customers.userId, user.id)).limit(1).then(r => r[0])
    if (customer) {
      await db.update(customers)
        .set({ name: body.name || customer.name, phone: body.phone || null, address: address || customer.address })
        .where(eq(customers.id, customer.id))
    }
    return { success: true, message: 'บันทึกข้อมูลสำเร็จ', data: null }
  }, {
    tags: ['Auth'], summary: 'บันทึก Profile',
    detail: { security: [{ BearerAuth: [] }] },
    beforeHandle: [requireAuth],
    body: t.Object({
      name: t.Optional(t.String()),         phone:       t.Optional(t.String()),
      houseNo: t.Optional(t.String()),      building:    t.Optional(t.String()),
      road: t.Optional(t.String()),         subDistrict: t.Optional(t.String()),
      district: t.Optional(t.String()),     province:    t.Optional(t.String()),
    }),
  })
