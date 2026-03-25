import { db, users } from '../../../db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Authentication Service
 * Handles user registration, login, password validation, and token generation
 */
export class AuthService {
  /**
   * Register new user with email and password
   */
  async registerUser(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role: 'CUSTOMER' | 'STAFF' | 'DRIVER' = 'CUSTOMER'
  ) {
    try {
      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
        .then(r => r[0]);

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          fullName,
          phone: phone || '',
          role,
        })
        .returning();

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(email: string, password: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Link LINE user to system user
   */
  async linkLineUser(
    userId: string,
    lineUserId: string,
    lineDisplayName?: string,
    linePictureUrl?: string
  ) {
    try {
      // Check if LINE user already linked
      const existingLineUser = await db
        .select()
        .from(lineUsers)
        .where(eq(lineUsers.lineUserId, lineUserId))
        .limit(1)
        .then(r => r[0]);

      if (existingLineUser && existingLineUser.userId !== userId) {
        throw new Error('This LINE account is already linked to another user');
      }

      if (existingLineUser) {
        // Update existing link
        await db
          .update(lineUsers)
          .set({
            displayName: lineDisplayName || existingLineUser.displayName,
            pictureUrl: linePictureUrl || existingLineUser.pictureUrl,
          })
          .where(eq(lineUsers.userId, userId));
      } else {
        // Create new LINE user link
        await db.insert(lineUsers).values({
          userId,
          lineUserId,
          displayName: lineDisplayName || '',
          pictureUrl: linePictureUrl || '',
          isFriend: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user with LINE info
   */
  async getUserWithLineInfo(userId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Get LINE info if exists
      const [lineInfo] = await db
        .select()
        .from(lineUsers)
        .where(eq(lineUsers.userId, userId))
        .limit(1);

      const { password: _, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        lineInfo: lineInfo || null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }
}
