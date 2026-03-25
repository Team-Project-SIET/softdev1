import Elysia, { t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { eq } from 'drizzle-orm'
import { db, users, customers, oauthAccounts } from '../db'
import { authPlugin } from '../middlewares/auth.middleware'

const LINE = {
  clientId:     process.env.LINE_CLIENT_ID!,
  clientSecret: process.env.LINE_CLIENT_SECRET!,
  redirectUri:  process.env.LINE_REDIRECT_URI!,
  authUrl:      'https://access.line.me/oauth2/v2.1/authorize',
  tokenUrl:     'https://api.line.me/oauth2/v2.1/token',
  profileUrl:   'https://api.line.me/v2/profile',
}

const GOOGLE = {
  clientId:     process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri:  process.env.GOOGLE_REDIRECT_URI!,
  authUrl:      'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl:     'https://oauth2.googleapis.com/token',
  profileUrl:   'https://www.googleapis.com/oauth2/v2/userinfo',
}

const JWT_SECRET = process.env.JWT_SECRET!
const WEB_URL    = process.env.WEB_URL || 'http://localhost:3000'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authPlugin(JWT_SECRET))
  .use(jwt({ name: 'jwt', secret: JWT_SECRET }))

  // ── GET /auth/me ──────────────────────────────────────────────────
  .get('/me', ({ user, set }) => {
    if (!user) {
      set.status = 401
      return { success: false, message: 'ยังไม่ได้ Login', data: null }
    }
    return { success: true, message: 'ok', data: user }
  }, {
    tags:    ['Auth'],
    summary: 'ดูข้อมูล user ที่ login อยู่',
    detail:  {
      description: 'ต้องส่ง Bearer token มาใน Authorization header',
      security: [{ BearerAuth: [] }],
    },
  })

  // ── GET /auth/line ────────────────────────────────────────────────
  .get('/line', ({ set }) => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     LINE.clientId,
      redirect_uri:  LINE.redirectUri,
      scope:         'profile openid',
      state:         crypto.randomUUID(),
    })
    set.redirect = `${LINE.authUrl}?${params}`
  }, {
    tags:    ['Auth'],
    summary: 'LINE OAuth2 Login (B2C Customer)',
    detail:  {
      description: `
**Step 1** — เปิด URL นี้ใน Browser เพื่อไป LINE Login page

Flow:
1. เปิด /auth/line → redirect ไป LINE
2. User login ใน LINE
3. LINE redirect กลับมาที่ /auth/line/callback?code=xxx
4. Server ออก JWT token
5. Redirect ไป frontend พร้อม token
      `,
    },
  })

  // ── GET /auth/line/callback ───────────────────────────────────────
  .get('/line/callback', async ({ query, jwt, set }) => {
    const { code } = query
    if (!code) {
      set.redirect = `${WEB_URL}/login?error=no_code`
      return
    }
    try {
      const tokenRes = await fetch(LINE.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code,
          redirect_uri: LINE.redirectUri,
          client_id: LINE.clientId,
          client_secret: LINE.clientSecret,
        }),
      })
      const tokenData = await tokenRes.json() as any
      const profileRes = await fetch(LINE.profileUrl, {
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
        await db.insert(customers).values({
          userId: user.id, name: profile.displayName, type: 'b2c',
        })
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

      const token = await jwt.sign({ userId: user.id, role: user.role })
      set.redirect = `${WEB_URL}/auth/callback?token=${token}`
    } catch (err) {
      console.error('[LINE OAuth Error]', err)
      set.redirect = `${WEB_URL}/login?error=line_failed`
    }
  }, {
    tags:    ['Auth'],
    summary: 'LINE OAuth2 Callback (auto-called by LINE)',
    detail:  {
      description: 'LINE เรียก route นี้อัตโนมัติ ไม่ต้องเรียกเอง — ใช้ /auth/line แทน',
    },
    query: t.Object({
      code:  t.Optional(t.String()),
      state: t.Optional(t.String()),
    }),
  })

  // ── GET /auth/google ──────────────────────────────────────────────
  .get('/google', ({ set }) => {
    const params = new URLSearchParams({
      client_id: GOOGLE.clientId, redirect_uri: GOOGLE.redirectUri,
      response_type: 'code', scope: 'email profile', access_type: 'offline',
    })
    set.redirect = `${GOOGLE.authUrl}?${params}`
  }, {
    tags:    ['Auth'],
    summary: 'Google OAuth2 Login (Admin / Staff / Driver / Executive)',
    detail:  {
      description: `
**Step 1** — เปิด URL นี้ใน Browser เพื่อไป Google Login page

ใช้สำหรับ: Admin, Staff, Driver, Executive เท่านั้น
B2C Customer ใช้ /auth/line แทน
      `,
    },
  })

  // ── GET /auth/google/callback ─────────────────────────────────────
  .get('/google/callback', async ({ query, jwt, set }) => {
    const { code } = query
    if (!code) {
      set.redirect = `${WEB_URL}/login?error=no_code`
      return
    }
    try {
      const tokenRes = await fetch(GOOGLE.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code, client_id: GOOGLE.clientId,
          client_secret: GOOGLE.clientSecret,
          redirect_uri: GOOGLE.redirectUri,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json() as any
      const profileRes = await fetch(GOOGLE.profileUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any

      let user = await db.select().from(users)
        .where(eq(users.email, profile.email))
        .limit(1).then(r => r[0])

      if (!user) {
        ;[user] = await db.insert(users).values({
          name: profile.name, email: profile.email, role: 'customer',
        }).returning()
      }

      const existing = await db.select().from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id)).limit(1).then(r => r[0])

      if (existing) {
        await db.update(oauthAccounts)
          .set({ accessToken: tokenData.access_token })
          .where(eq(oauthAccounts.userId, user.id))
      } else {
        await db.insert(oauthAccounts).values({
          userId: user.id, provider: 'google',
          providerAccountId: profile.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
        })
      }

      const token = await jwt.sign({ userId: user.id, role: user.role })
      set.redirect = `${WEB_URL}/auth/callback?token=${token}`
    } catch (err) {
      console.error('[Google OAuth Error]', err)
      set.redirect = `${WEB_URL}/login?error=google_failed`
    }
  }, {
    tags:    ['Auth'],
    summary: 'Google OAuth2 Callback (auto-called by Google)',
    detail:  {
      description: 'Google เรียก route นี้อัตโนมัติ ไม่ต้องเรียกเอง — ใช้ /auth/google แทน',
    },
    query: t.Object({
      code:  t.Optional(t.String()),
      state: t.Optional(t.String()),
    }),
  })
