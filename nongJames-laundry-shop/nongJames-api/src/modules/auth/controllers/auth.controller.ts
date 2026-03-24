import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export class AuthController {

  // ── receive jwt from Elysia context, not from plugin directly ──
  private async generateTokens(user: any, jwt: any) {
    const accessToken = await jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await jwt.sign({
      userId: user.id,
    });

    return { accessToken, refreshToken };
  }

  async login(body: any, jwt: any) {
    try {
      const { email } = body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return { success: false, message: 'Invalid email or password', data: null };
      }

      const tokens = await this.generateTokens(user, jwt);

      return {
        success: true,
        message: 'Login successful',
        data: {
          ...tokens,
          user: { id: user.id, name: user.fullName, email: user.email, role: user.role },
        },
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Login failed', data: null };
    }
  }

  async register(body: any, jwt: any) {
    try {
      const { name, email, role = 'CUSTOMER' } = body;

      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) {
        return { success: false, message: 'Email already registered', data: null };
      }

      const [newUser] = await db
        .insert(users)
        .values({ fullName: name, email, role: role.toUpperCase() })
        .returning();

      const tokens = await this.generateTokens(newUser, jwt);

      return {
        success: true,
        message: 'Registration successful',
        data: {
          ...tokens,
          user: { id: newUser.id, name: newUser.fullName, email: newUser.email, role: newUser.role },
        },
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Registration failed', data: null };
    }
  }

  async refreshToken(body: any, jwt: any, set: any) {
    try {
      const { refreshToken: token } = body;
      if (!token) {
        set.status = 401;
        return { success: false, message: 'Refresh token required', data: null };
      }

      const decoded = await jwt.verify(token);
      if (!decoded) {
        set.status = 401;
        return { success: false, message: 'Invalid refresh token', data: null };
      }

      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      if (!user) {
        set.status = 401;
        return { success: false, message: 'User not found', data: null };
      }

      const tokens = await this.generateTokens(user, jwt);
      return { success: true, message: 'Token refreshed', data: tokens };
    } catch (error) {
      set.status = 401;
      return { success: false, message: 'Invalid refresh token', data: null };
    }
  }

  async logout() {
    return { success: true, message: 'Logged out successfully', data: null };
  }

  async getProfile(user: any, set: any) {
    if (!user) {
      set.status = 401;
      return { success: false, message: 'Not authenticated', data: null };
    }

    const [userDetails] = await db
      .select({ id: users.id, name: users.fullName, email: users.email, role: users.role, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return { success: true, message: 'Profile retrieved', data: userDetails };
  }
}