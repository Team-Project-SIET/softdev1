/**
 * Authentication Routes
 * POST /auth/register - สมัครสมาชิก (B2C/Staff)
 * POST /auth/login - Login และรับ JWT
 * GET /auth/me - ดูข้อมูลส่วนตัว
 */

import Elysia, { t } from 'elysia';
import { db } from '@/db';
import { users, lineUsers } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import jwt from '@elysiajs/jwt';
import bcrypt from 'bcrypt';

// Types
interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: 'CUSTOMER' | 'STAFF';
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    accessToken: string;
    expiresIn: number;
  };
  error?: string;
  timestamp: string;
}

interface AuthContext {
  userId?: string;
  email?: string;
  role?: string;
}

// JWT Plugin
const jwtPlugin = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
});

// Auth Middleware
export const authMiddleware = new Elysia({ name: 'authMiddleware' })
  .use(jwtPlugin)
  .derive(async ({ headers }) => {
    const token = headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return { userId: null, user: null };
    }

    try {
      const payload = await jwtPlugin.verify(token);
      return { userId: payload.sub, user: payload };
    } catch (error) {
      return { userId: null, user: null };
    }
  });

// Create Auth Routes
export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(jwtPlugin)

  // ============================================
  // POST /register - สมัครสมาชิก
  // ============================================
  .post(
    '/register',
    async ({ body }) => {
      try {
        // Validate email doesn't already exist
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, body.email));

        if (existingUser) {
          return {
            success: false,
            error: 'Email already registered',
            timestamp: new Date().toISOString(),
          };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Create user
        const [newUser] = await db
          .insert(users)
          .values({
            email: body.email,
            password: hashedPassword,
            fullName: body.fullName,
            phone: body.phone,
            role: body.role || 'CUSTOMER',
            isActive: true,
            membershipLevel: 'STANDARD',
            loyaltyPoints: 0,
          })
          .returning();

        console.log(`[AUTH] User registered: ${newUser.id} - ${body.email}`);

        return {
          success: true,
          data: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
          },
          message: 'Registration successful',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[AUTH] Registration error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        fullName: t.String({ minLength: 2 }),
        phone: t.Optional(t.String()),
        role: t.Optional(t.Union([t.Literal('CUSTOMER'), t.Literal('STAFF')])),
      }),
    }
  )

  // ============================================
  // POST /login - Login และรับ JWT
  // ============================================
  .post(
    '/login',
    async ({ body, jwt }) => {
      try {
        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, body.email));

        if (!user) {
          return {
            success: false,
            error: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          };
        }

        // Check if user is active
        if (!user.isActive) {
          return {
            success: false,
            error: 'Account is inactive',
            timestamp: new Date().toISOString(),
          };
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(body.password, user.password!);

        if (!passwordMatch) {
          return {
            success: false,
            error: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          sub: user.id,
          email: user.email,
          role: user.role,
        });

        console.log(`[AUTH] User logged in: ${user.id}`);

        const response: LoginResponse = {
          success: true,
          data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            accessToken: token,
            expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
          },
          timestamp: new Date().toISOString(),
        };

        return response;
      } catch (error) {
        console.error('[AUTH] Login error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )

  // ============================================
  // GET /me - ดูข้อมูลส่วนตัว (รองรับ LINE Login)
  // ============================================
  .get(
    '/me',
    async ({ headers }) => {
      try {
        // Extract token from Authorization header
        const token = headers['authorization']?.replace('Bearer ', '');

        if (!token) {
          return {
            success: false,
            error: 'No authorization token provided',
            timestamp: new Date().toISOString(),
          };
        }

        // Verify token and get payload
        let payload;
        try {
          payload = await jwtPlugin.verify(token);
        } catch (error) {
          return {
            success: false,
            error: 'Invalid or expired token',
            timestamp: new Date().toISOString(),
          };
        }

        // Get user from database
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.sub));

        if (!user) {
          return {
            success: false,
            error: 'User not found',
            timestamp: new Date().toISOString(),
          };
        }

        // If user has LINE connection, get LINE data
        let lineData = null;
        if (user.lineUserId) {
          const [lineUser] = await db
            .select()
            .from(lineUsers)
            .where(eq(lineUsers.userId, user.id));

          lineData = lineUser || null;
        }

        console.log(`[AUTH] Fetched user profile: ${user.id}`);

        return {
          success: true,
          data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            membershipLevel: user.membershipLevel,
            loyaltyPoints: user.loyaltyPoints,
            lineUserId: user.lineUserId,
            lineDisplayName: user.lineDisplayName,
            linePictureUrl: user.linePictureUrl,
            lineData: lineData ? {
              isFriend: lineData.isFriend,
              notificationsEnabled: lineData.notificationsEnabled,
              language: lineData.language,
            } : null,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[AUTH] Get profile error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch profile',
          timestamp: new Date().toISOString(),
        };
      }
    }
  )

  // ============================================
  // POST /line/callback - LINE Bot Webhook
  // ============================================
  .post(
    '/line/callback',
    async ({ body }) => {
      try {
        const lineWebhook = body as any;

        // Verify signature (implement LINE signature verification)
        // TODO: Add LINE signature verification

        const events = lineWebhook.events || [];

        for (const event of events) {
          if (event.type === 'follow') {
            // User added bot as friend
            console.log(`[LINE] User followed: ${event.source.userId}`);

            // Check if user exists by LINE ID
            const [existingLineUser] = await db
              .select()
              .from(lineUsers)
              .where(eq(lineUsers.lineUserId, event.source.userId));

            if (!existingLineUser) {
              // Create new user linked to LINE
              // In production, get user info from LINE API
              const [newUser] = await db
                .insert(users)
                .values({
                  lineUserId: event.source.userId,
                  lineDisplayName: 'LINE User',
                  role: 'CUSTOMER',
                  isActive: true,
                  membershipLevel: 'STANDARD',
                  loyaltyPoints: 0,
                })
                .returning();

              await db
                .insert(lineUsers)
                .values({
                  userId: newUser.id,
                  lineUserId: event.source.userId,
                  displayName: 'LINE User',
                  isFriend: true,
                  friendSince: new Date(),
                  notificationsEnabled: true,
                  language: 'th',
                });
            }
          }
        }

        return { success: true };
      } catch (error) {
        console.error('[LINE] Webhook error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Webhook error' };
      }
    },
    {
      body: t.Object({
        events: t.Array(
          t.Object({
            type: t.String(),
            source: t.Optional(t.Object({ userId: t.String() })),
          })
        ),
      }),
    }
  );

export default authRoutes;
