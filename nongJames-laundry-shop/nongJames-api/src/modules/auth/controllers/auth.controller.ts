import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class AuthController {

  /**
   * Generate JWT tokens for user
   */
  private async generateTokens(user: any, jwt: any) {
    try {
      const accessToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = await jwt.sign({
        userId: user.id,
        type: 'refresh',
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error('Failed to generate tokens');
    }
  }

  /**
   * Login with email and password
   */
  async login(body: any, jwt: any, context: any) {
    try {
      const { email, password } = body;

      // Find user by email
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      const user = result[0];

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Invalid email or password', data: null };
      }

      // Verify password
      if (!user.password) {
        context.set.status = 401;
        return { success: false, message: 'Invalid email or password', data: null };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        context.set.status = 401;
        return { success: false, message: 'Invalid email or password', data: null };
      }

      // Generate tokens
      const tokens = await this.generateTokens(user, jwt);

      return {
        success: true,
        message: 'Login successful',
        data: {
          ...tokens,
          user: { 
            id: user.id, 
            name: user.fullName, 
            email: user.email, 
            role: user.role 
          },
        },
      };
    } catch (error) {
      console.error('[AuthController.login] Error:', error);
      context.set.status = 500;
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Login failed', 
        data: null 
      };
    }
  }

  /**
   * Register new user
   */
  async register(body: any, jwt: any, context: any) {
    try {
      const { name, email, password, role = 'CUSTOMER' } = body;

      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existing.length > 0) {
        context.set.status = 400;
        return { success: false, message: 'Email already registered', data: null };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db
        .insert(users)
        .values({ 
          fullName: name, 
          email, 
          password: hashedPassword,
          role: role.toUpperCase() 
        })
        .returning();

      const newUser = result[0];

      // Generate tokens
      const tokens = await this.generateTokens(newUser, jwt);

      context.set.status = 201;
      return {
        success: true,
        message: 'Registration successful',
        data: {
          ...tokens,
          user: { 
            id: newUser.id, 
            name: newUser.fullName, 
            email: newUser.email, 
            role: newUser.role 
          },
        },
      };
    } catch (error) {
      console.error('[AuthController.register] Error:', error);
      context.set.status = 500;
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Registration failed', 
        data: null 
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(body: any, jwt: any, context: any) {
    try {
      const { refreshToken: token } = body;
      if (!token) {
        context.set.status = 401;
        return { success: false, message: 'Refresh token required', data: null };
      }

      const decoded = await jwt.verify(token);
      if (!decoded || decoded.type !== 'refresh') {
        context.set.status = 401;
        return { success: false, message: 'Invalid refresh token', data: null };
      }

      // Get user
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      const user = result[0];
      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'User not found', data: null };
      }

      // Generate new access token
      const accessToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { 
        success: true, 
        message: 'Token refreshed', 
        data: { accessToken } 
      };
    } catch (error) {
      console.error('[AuthController.refreshToken] Error:', error);
      context.set.status = 401;
      return { 
        success: false, 
        message: 'Invalid refresh token', 
        data: null 
      };
    }
  }

  /**
   * Logout (client should discard tokens)
   */
  async logout(context: any) {
    try {
      return { 
        success: true, 
        message: 'Logged out successfully', 
        data: null 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Logout failed', 
        data: null 
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(user: any, context: any) {
    try {
      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Not authenticated', data: null };
      }

      const result = await db
        .select({
          id: users.id,
          name: users.fullName,
          email: users.email,
          role: users.role,
          phone: users.phone,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const userProfile = result[0];

      return { 
        success: true, 
        message: 'Profile retrieved', 
        data: userProfile 
      };
    } catch (error) {
      console.error('[AuthController.getProfile] Error:', error);
      context.set.status = 500;
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to get profile', 
        data: null 
      };
    }
  }
}