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

const getSecret = () => process.env.JWT_SECRET || 'fallback_secret'
const WEB_URL    = process.env.WEB_URL || 'http://localhost:3000'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authPlugin(getSecret()))
  .use(jwt({ name: 'jwt', secret: getSecret() }))

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
    detail:  { security: [{ BearerAuth: [] }] },
  })

// ── GET /auth/line ────────────────────────────────────────────────
.get('/line', () => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINE_CLIENT_ID!,
    redirect_uri:  process.env.LINE_REDIRECT_URI!,
    scope:         'profile openid',
    state:         crypto.randomUUID(),
  })
  const url = `https://access.line.me/oauth2/v2.1/authorize?${params}`
  return Response.redirect(url, 302)
}, {
  tags:    ['Auth'],
  summary: 'LINE OAuth2 Login',
})

// ── GET /auth/line/callback ───────────────────────────────────────
.get('/line/callback', async ({ query, jwt }) => {
  const WEB  = process.env.WEB_URL || 'http://localhost:3000'
  const { code } = query

  if (!code) return Response.redirect(`${WEB}/login?error=no_code`, 302)

  try {
    // ① แลก code → access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.LINE_REDIRECT_URI!,
        client_id:     process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    })
    const tokenData = await tokenRes.json() as any

    // ② ดึง profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json() as any

    // ③ หา user หรือสร้างใหม่
    let user = await db.select().from(users)
      .where(eq(users.email, `${profile.userId}@line.njlaundry`))
      .limit(1).then(r => r[0])

    if (!user) {
      ;[user] = await db.insert(users).values({
        name:  profile.displayName,
        email: `${profile.userId}@line.njlaundry`,
        role:  'customer',
      }).returning()

      await db.insert(customers).values({
        userId: user.id,
        name:   profile.displayName,
        type:   'b2c',
      })
    }

    // ④ upsert oauth_accounts
    const existing = await db.select().from(oauthAccounts)
      .where(eq(oauthAccounts.userId, user.id))
      .limit(1).then(r => r[0])

    if (existing) {
      await db.update(oauthAccounts)
        .set({ lineUserId: profile.userId, accessToken: tokenData.access_token })
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

    // ⑤ ออก JWT แล้ว redirect ไป Frontend
    const token = await jwt.sign({ userId: user.id, role: user.role })

    const userJson = encodeURIComponent(JSON.stringify({
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    }))
    return Response.redirect(
      `${WEB}/auth/callback?token=${token}&user=${userJson}`,
      302
    )
    

  } catch (err) {
    console.error('[LINE Callback Error]', err)
    return Response.redirect(`${WEB}/login?error=line_failed`, 302)
  }
}, {
  tags:  ['Auth'],
  summary: 'LINE OAuth2 Callback',
  query: t.Object({
    code:  t.Optional(t.String()),
    state: t.Optional(t.String()),
  }),
})


  // ── GET /auth/google ──────────────────────────────────────────────
  .get('/google', () => {
    const params = new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope:         'email profile',
      access_type:   'offline',
    })
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    return Response.redirect(url, 302)
  }, {
    tags:    ['Auth'],
    summary: 'Google OAuth2 Login',
  })

  // ── GET /auth/google/callback ─────────────────────────────────────
  .get('/google/callback', async ({ query, jwt }) => {
    const WEB  = process.env.WEB_URL || 'http://localhost:3000'
    const { code } = query

    if (!code) return Response.redirect(`${WEB}/login?error=no_code`, 302)

    try {
      // ① แลก code → token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
          grant_type:    'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json() as any

      // ② ดึง profile
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any

      // ③ หา user หรือสร้างใหม่
      let user = await db.select().from(users)
        .where(eq(users.email, profile.email))
        .limit(1).then(r => r[0])

      if (!user) {
        ;[user] = await db.insert(users).values({
          name:  profile.name,
          email: profile.email,
          role:  'customer',
        }).returning()

        await db.insert(customers).values({
          userId: user.id,
          name:   profile.name,
          type:   'b2c',
        })
      }

      // ④ upsert oauth_accounts
      const existing = await db.select().from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id))
        .limit(1).then(r => r[0])

      if (existing) {
        await db.update(oauthAccounts)
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

      // ⑤ ออก JWT แล้ว redirect ไป Frontend
      const token = await jwt.sign({ userId: user.id, role: user.role })

      const userJson = encodeURIComponent(JSON.stringify({
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      }))
      return Response.redirect(
        `${WEB_URL}/auth/callback?token=${token}&user=${userJson}`,
        302
      )

    } catch (err) {
      console.error('[Google Callback Error]', err)
      return Response.redirect(`${WEB}/login?error=google_failed`, 302)
    }
  }, {
    tags:  ['Auth'],
    summary: 'Google OAuth2 Callback',
    query: t.Object({
      code:  t.Optional(t.String()),
      state: t.Optional(t.String()),
    }),
  })
  // ── POST /auth/dev-login ──────────────────────────────────────────
  // ⚠️ ใช้แค่ dev เท่านั้น!
  .post('/dev-login', async ({ body, jwt, set }) => {
    if (process.env.NODE_ENV === 'production') {
      set.status = 404
      return { success: false, message: 'Not found', data: null }
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1)
      .then(r => r[0])

    if (!user) {
      set.status = 404
      return { success: false, message: `ไม่พบ user: ${body.email}`, data: null }
    }

    const token = await jwt.sign({ userId: user.id, role: user.role })

    return {
      success: true,
      message: `Login สำเร็จ role: ${user.role}`,
      data: { token, user },
    }
  }, {
    tags:    ['Auth'],
    summary: '⚠️ Dev Only — Login ด้วย email',
    body: t.Object({
      email: t.String({ description: 'อีเมลของ user ใน seed' }),
    }),
  })
    // ── POST /auth/register ───────────────────────────────────────────
  .post('/register', async ({ body, jwt, set }) => {
    const { name, email, password, phone, role } = body

    // เช็คว่า email ซ้ำไหม
    const existing = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(r => r[0])

    if (existing) {
      set.status = 409
      return {
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น',
        data: null,
      }
    }

    // Hash password ด้วย Bun built-in (ไม่ต้องติดตั้ง library เพิ่ม!)
    const passwordHash = await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost:      10,
    })

    // สร้าง user
    const [user] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: (role as any) || 'customer',
    }).returning()

    // สร้าง customer record ควบคู่
    await db.insert(customers).values({
      userId: user.id,
      name,
      phone:  phone || null,
      type:   'b2c',
    }).catch(() => {}) // ไม่ fail ถ้า insert ไม่สำเร็จ

    // ออก JWT
    const token = await jwt.sign({ userId: user.id, role: user.role })

    set.status = 201
    return {
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    }
  }, {
    tags:    ['Auth'],
    summary: 'สมัครสมาชิกด้วย Email + Password',
    body: t.Object({
      name:     t.String({ minLength: 2,  description: 'ชื่อ-นามสกุล'   }),
      email:    t.String({ format: 'email', description: 'อีเมล'         }),
      password: t.String({ minLength: 8,  description: 'รหัสผ่าน 8+ ตัว' }),
      phone:    t.Optional(t.String({ description: 'เบอร์โทรศัพท์' })),
      role:     t.Optional(t.String({ description: 'ตำแหน่ง (default: customer)' })),
    }),
  })

  // ── POST /auth/login ──────────────────────────────────────────────
  .post('/login', async ({ body, jwt, set }) => {
    const { email, password } = body

    // หา user จาก email
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(r => r[0])

    // ไม่พบ user
    if (!user) {
      set.status = 401
      return {
        success: false,
        message: 'ไม่พบบัญชีนี้ในระบบ กรุณาตรวจสอบอีเมล',
        data: null,
      }
    }

    // user นี้ใช้ OAuth (ไม่มี password)
    if (!user.passwordHash) {
      set.status = 401
      return {
        success: false,
        message: 'บัญชีนี้ใช้การเข้าสู่ระบบผ่าน LINE หรือ Google กรุณากดปุ่มด้านล่าง',
        data: null,
      }
    }

    // ตรวจสอบ password
    const isValid = await Bun.password.verify(password, user.passwordHash)

    if (!isValid) {
      set.status = 401
      return {
        success: false,
        message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
        data: null,
      }
    }

    // ออก JWT
    const token = await jwt.sign({ userId: user.id, role: user.role })

    return {
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    }
  }, {
    tags:    ['Auth'],
    summary: 'Login ด้วย Email + Password',
    body: t.Object({
      email:    t.String({ format: 'email', description: 'อีเมล'    }),
      password: t.String({ minLength: 1,    description: 'รหัสผ่าน' }),
    }),
  })
