// ── GET /auth/google/callback ───────────────────────────────────────
.get('/google/callback', async ({ query, jwt, set }) => {
  const { code } = query
  if (!code) {
    set.redirect = `${WEB_URL}/login?error=no_code`
    return
  }
  try {
    // แลก code → token
    const tokenRes = await fetch(GOOGLE.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: GOOGLE.clientId,
        client_secret: GOOGLE.clientSecret,
        redirect_uri:  GOOGLE.redirectUri,
        grant_type:    'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json() as any

    // ดึง profile
    const profileRes = await fetch(GOOGLE.profileUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json() as any
    // profile = { id, email, name, picture }

    // หา user หรือสร้างใหม่
    let user = await db.select().from(users)
      .where(eq(users.email, profile.email))
      .limit(1).then(r => r[0])

    if (!user) {
      // ✅ สร้าง user
      ;[user] = await db.insert(users).values({
        name:  profile.name,
        email: profile.email,
        role:  'customer', // default ทุกคนเริ่มเป็น customer
        // admin เปลี่ยน role ให้ทีหลังใน Admin Portal
      }).returning()

      // ✅ สร้าง customer record ด้วย (เหมือน LINE)
      await db.insert(customers).values({
        userId: user.id,
        name:   profile.name,
        type:   'b2c',
      })
    }

    // upsert oauth_accounts
    await db.insert(oauthAccounts).values({
      userId:            user.id,
      provider:          'google',
      providerAccountId: profile.id,
      accessToken:       tokenData.access_token,
      refreshToken:      tokenData.refresh_token ?? null,
    }).onConflictDoUpdate({
      // ← ใช้ unique constraint ที่เพิ่งสร้าง
      target:  [oauthAccounts.userId, oauthAccounts.provider],
      set: {
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
      },
    })

    const token = await jwt.sign({ userId: user.id, role: user.role })
    set.redirect = `${WEB_URL}/auth/callback?token=${token}`

  } catch (err) {
    console.error('[Google OAuth Error]', err)
    set.redirect = `${WEB_URL}/login?error=google_failed`
  }
}, {
  tags:    ['Auth'],
  summary: 'Google OAuth2 Callback',
  query:   t.Object({ code: t.Optional(t.String()), state: t.Optional(t.String()) }),
})
