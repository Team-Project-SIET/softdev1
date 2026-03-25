import { db } from '../../db';
import postgres from 'postgres';

/**
 * Database Transaction Wrapper
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const user = await tx.insert(users).values({...}).returning();
 *     const order = await tx.insert(orders).values({...}).returning();
 *     return { user, order };
 *   });
 */
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const client = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/laundry');

  try {
    // Start transaction
    await client`BEGIN`;

    const result = await callback(client);

    // Commit transaction
    await client`COMMIT`;

    return result;
  } catch (error) {
    // Rollback on error
    await client`ROLLBACK`;
    console.error('[Transaction] Rollback due to error:', error);
    throw error;
  } finally {
    // End connection
    await client.end();
  }
}

/**
 * Alternative: Using Drizzle's built-in transaction support
 *
 * Usage:
 *   const result = await db.transaction(async (tx) => {
 *     const user = await tx.insert(users).values({...}).returning();
 *     const order = await tx.insert(orders).values({...}).returning();
 *     return { user, order };
 *   });
 */
export async function withDrizzleTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      return await callback(tx);
      
    } catch (error) {
      console.error('[DrizzleTransaction] Error in transaction:', error);
      throw error;
    }
  });
}

/**
 * Retry wrapper for operations that may fail due to race conditions
 *
 * Usage:
 *   const result = await withRetry(async () => {
 *     return await db.select().from(users).where(eq(users.id, id));
 *   }, { maxRetries: 3, delayMs: 100 });
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 100 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Retry] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
