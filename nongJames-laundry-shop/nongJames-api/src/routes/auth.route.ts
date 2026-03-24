import Elysia, { t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users, customers, oauthAccounts } from '../db/schema'
import { authPlugin } from '../middlewares/auth.middleware'

// ── LINE OAuth Config ─────────────────────────────────────────────────
// ต้องสมัคร LINE Developers Console ก่อน
// https://developers.line.biz/
const LINE = {
  clientId:     process.env.LINE_CLIENT_ID!,
  clientSecret: process.env.LINE_CLIENT_SECRET!,
  redirectUri:  process.env.LINE_REDIRECT_URI!,
  // URL สำหรับ redirect ไป LINE login
  authUrl:      'https://access.line.me/oauth2/v2.1/authorize',
  // URL สำหรับแลก code → token
  tokenUrl:     'https://api.line.me/oauth2/v2.1/token',
  // URL สำหรับดึง profile
  profileUrl:   'https://api.line.me/v2/profile',
}

// ── Google OAuth Config ───────────────────────────────────────────────
// ต้องสมัคร Google Cloud Console ก่อน
// https://console.cloud.google.com/
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

  // ── GET /auth/me ────────────────────────────────────────────────────
  // ดูข้อมูลตัวเอง (ต้องแนบ token มาด้วย)
  .get('/me', (ctx) => {
    const user = (ctx.store as any)?.user
    const { set } = ctx
    if (!user) {
      set.status = 401
      return { success: false, message: 'ยังไม่ได้ Login', data: null }
    }
    return { success: true, message: 'ok', data: user }
  })

  // ════════════════════════════════════════════════════════════════════
  // LINE OAuth — สำหรับ B2C Customer
  // ════════════════════════════════════════════════════════════════════

  // ── GET /auth/line ──────────────────────────────────────────────────
  // Step 1: redirect ไป LINE login page
  // Frontend เรียก: window.location.href = 'http://localhost:8000/auth/line'
  .get('/line', ({ set }) => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     LINE.clientId,
      redirect_uri:  LINE.redirectUri,
      scope:         'profile openid',
      // state ป้องกัน CSRF attack (random string)
      state:         crypto.randomUUID(),
    })
    set.redirect = `${LINE.authUrl}?${params}`
  })

  // ── GET /auth/line/callback ─────────────────────────────────────────
  // Step 2: LINE redirect กลับมาพร้อม ?code=xxx
  .get('/line/callback', async ({ query, jwt, set }) => {
    const { code } = query

    if (!code) {
      set.redirect = `${WEB_URL}/login?error=no_code`
      return
    }

    try {
      // ① แลก code → access token
      const tokenRes = await fetch(LINE.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:   'authorization_code',
          code,
          redirect_uri:  LINE.redirectUri,
          client_id:     LINE.clientId,
          client_secret: LINE.clientSecret,
        }),
      })
      const tokenData = await tokenRes.json() as any
      // tokenData.access_token = ใช้ดึง profile

      // ② ดึง profile จาก LINE
      const profileRes = await fetch(LINE.profileUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any
      // profile = { userId, displayName, pictureUrl }

      // ③ หา user ใน DB หรือสร้างใหม่
      // วิธีจำ: "upsert" = update if exists, insert if not
      let user = await db
        .select()
        .from(users)
        // ค้นหาด้วย email จาก LINE (LINE ไม่เสมอให้ email จึงใช้ userId แทน)
        .where(eq(users.email, `${profile.userId}@line.njlaundry`))
        .limit(1)
        .then(r => r[0])

      if (!user) {
        // ไม่มีใน DB → สร้างใหม่
        ;[user] = await db.insert(users).values({
          fullName:  profile.displayName,
          email: `${profile.userId}@line.njlaundry`,
          role:  'CUSTOMER',
        }).returning()

        // สร้าง customer profile ควบคู่กัน
        await db.insert(customers).values({
          userId: user.id,
          name:   profile.displayName,
          customerType:   'INDIVIDUAL',
        })
      }

      // ④ บันทึก / อัปเดต OAuth account
      // สำคัญ! lineUserId ใช้ส่ง push notification ภายหลัง
      const existingOAuth = await db
        .select()
        .from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id))
        .limit(1)
        .then(r => r[0])

      if (existingOAuth) {
        await db
          .update(oauthAccounts)
          .set({
            lineUserId:   profile.userId,
            accessToken:  tokenData.access_token,
          })
          .where(eq(oauthAccounts.userId, user.id))
      } else {
        await db.insert(oauthAccounts).values({
          userId:            user.id,
          provider:          'line',
          providerAccountId: profile.userId,
          lineUserId:        profile.userId,
          accessToken:       tokenData.access_token,
        })
      }

      // ⑤ ออก JWT token ของเรา
      const token = await jwt.sign({
        userId: user.id,
        role:   user.role,
      })

      // ⑥ redirect กลับ Frontend พร้อม token
      set.redirect = `${WEB_URL}/auth/callback?token=${token}`

    } catch (err) {
      console.error('[LINE OAuth Error]', err)
      set.redirect = `${WEB_URL}/login?error=line_failed`
    }
  }, {
    query: t.Object({
      code:  t.Optional(t.String()),
      state: t.Optional(t.String()),
    }),
  })

  // ════════════════════════════════════════════════════════════════════
  // Google OAuth — สำหรับ Admin / Staff / Driver / Executive
  // ════════════════════════════════════════════════════════════════════

  // ── GET /auth/google ────────────────────────────────────────────────
  .get('/google', ({ set }) => {
    const params = new URLSearchParams({
      client_id:     GOOGLE.clientId,
      redirect_uri:  GOOGLE.redirectUri,
      response_type: 'code',
      scope:         'email profile',
      access_type:   'offline',
    })
    set.redirect = `${GOOGLE.authUrl}?${params}`
  })

  // ── GET /auth/google/callback ───────────────────────────────────────
  .get('/google/callback', async ({ query, jwt, set }) => {
    const { code } = query

    if (!code) {
      set.redirect = `${WEB_URL}/login?error=no_code`
      return
    }

    try {
      // ① แลก code → token
      const tokenRes = await fetch(GOOGLE.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     GOOGLE.clientId,
          client_secret: GOOGLE.clientSecret,
          redirect_uri:  GOOGLE.redirectUri,
          grant_type:    'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json() as any

      // ② ดึง profile
      const profileRes = await fetch(GOOGLE.profileUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any
      // profile = { id, email, name, picture }

      // ③ หา user ด้วย email หรือสร้างใหม่
      let user = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1)
        .then(r => r[0])

      if (!user) {
        // Admin ใหม่ต้องให้ Super Admin ไป assign role ภายหลัง
        // default role เป็น CUSTOMER ก่อน
        ;[user] = await db.insert(users).values({
          fullName:  profile.name,
          email: profile.email,
          role:  'CUSTOMER',
        }).returning()
      }

      // ④ บันทึก OAuth account
      const existingOAuth = await db
        .select()
        .from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id))
        .limit(1)
        .then(r => r[0])

      if (existingOAuth) {
        await db
          .update(oauthAccounts)
          .set({ accessToken: tokenData.access_token })
          .where(eq(oauthAccounts.userId, user.id))
      } else {
        await db.insert(oauthAccounts).values({
          userId:            user.id,
          provider:          'google',
          providerAccountId: profile.id,
          accessToken:       tokenData.access_token,
          refreshToken:      tokenData.refresh_token ?? null,
        })
      }

      // ⑤ ออก JWT
      const token = await jwt.sign({
        userId: user.id,
        role:   user.role,
      })

      // ⑥ redirect กลับ Frontend
      set.redirect = `${WEB_URL}/auth/callback?token=${token}`

    } catch (err) {
      console.error('[Google OAuth Error]', err)
      set.redirect = `${WEB_URL}/login?error=google_failed`
    }
  }, {
    query: t.Object({
      code:  t.Optional(t.String()),
      state: t.Optional(t.String()),
    }),
  })
