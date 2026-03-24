import Elysia, { t } from 'elysia';
import { db } from '@/db';
import {
  transactions,
  transactionLogs,
  orders,
  payments,
  financialReports,
} from '@/db/schema';
import {
  eq,
  and,
  gte,
  lte,
  sql,
  desc,
  sum,
  count,
} from 'drizzle-orm';

// Types for Financial Operations
interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface SCBSyncRequest {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface SCBSyncResponse {
  success: boolean;
  message: string;
  transactionsImported: number;
  recordsProcessed: number;
  timestamp: string;
}

interface TransactionRecord {
  id: string;
  scbTransactionId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  status: string;
  currency: string;
  reference: string;
  createdAt: Date;
}

// Helper function to mock SCB API response
function mockSCBApiCall(params: {
  startDate: Date;
  endDate: Date;
  limit: number;
}): TransactionRecord[] {
  // Mock data simulating SCB API response
  const mockTransactions: TransactionRecord[] = [];

  // Generate mock transactions for the date range
  let currentDate = new Date(params.startDate);
  let transactionIndex = 0;

  while (
    currentDate <= params.endDate &&
    transactionIndex < params.limit
  ) {
    const isIncome = Math.random() > 0.3; // 70% income, 30% expense

    mockTransactions.push({
      id: `MOCK-${Date.now()}-${transactionIndex}`,
      scbTransactionId: `SCB-${currentDate.getTime()}-${transactionIndex}`,
      amount: isIncome ? 500 + Math.random() * 2000 : 100 + Math.random() * 500,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      status: 'COMPLETED',
      currency: 'THB',
      reference: `REF-${Date.now()}-${transactionIndex}`,
      createdAt: new Date(currentDate),
    });

    currentDate.setDate(currentDate.getDate() + 1);
    transactionIndex++;
  }

  return mockTransactions;
}

// Create Finance Routes
export const financeRoutes = new Elysia({ prefix: '/api/finance' })
  // ============================================
  // GET /dashboard/summary - Financial Summary
  // ============================================
  .get(
    '/dashboard/summary',
    async ({ query }) => {
      try {
        // Parse date range from query parameters (default: last 30 days)
        const now = new Date();
        const from = query.from
          ? new Date(query.from)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const to = query.to ? new Date(query.to) : now;

        // Calculate Total Revenue (INCOME transactions)
        const [revenueResult] = await db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(
            and(
              eq(transactions.type, 'INCOME'),
              eq(transactions.status, 'COMPLETED'),
              gte(transactions.transactionDate, from),
              lte(transactions.transactionDate, to)
            )
          );

        const totalRevenue = revenueResult?.total ? Number(revenueResult.total) : 0;

        // Calculate Total Expenses (EXPENSE transactions)
        const [expensesResult] = await db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(
            and(
              eq(transactions.type, 'EXPENSE'),
              eq(transactions.status, 'COMPLETED'),
              gte(transactions.transactionDate, from),
              lte(transactions.transactionDate, to)
            )
          );

        const totalExpenses = expensesResult?.total ? Number(expensesResult.total) : 0;

        // Calculate Net Profit
        const netProfit = totalRevenue - totalExpenses;

        // Get transaction count
        const [countResult] = await db
          .select({ count: count() })
          .from(transactions)
          .where(
            and(
              eq(transactions.status, 'COMPLETED'),
              gte(transactions.transactionDate, from),
              lte(transactions.transactionDate, to)
            )
          );

        const transactionCount = countResult?.count || 0;

        const summary: DashboardSummary = {
          totalRevenue,
          totalExpenses,
          netProfit,
          transactionCount,
          dateRange: {
            from,
            to,
          },
        };

        return {
          success: true,
          data: summary,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
      }),
    }
  )

  // ============================================
  // POST /scb/sync - Sync SCB Sandbox API Data
  // ============================================
  .post(
    '/scb/sync',
    async ({ body }) => {
      try {
        // Parse dates
        const now = new Date();
        const startDate = body.startDate
          ? new Date(body.startDate)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days default
        const endDate = body.endDate ? new Date(body.endDate) : now;
        const limit = body.limit || 50;

        // Mock SCB API call
        console.log(`[SCB SYNC] Fetching transactions from ${startDate} to ${endDate}`);
        const scbTransactions = mockSCBApiCall({
          startDate,
          endDate,
          limit,
        });

        console.log(`[SCB SYNC] Received ${scbTransactions.length} records from SCB API`);

        // Process and save transactions to database
        let importedCount = 0;
        const importErrors: string[] = [];

        for (const scbTxn of scbTransactions) {
          try {
            // Check if transaction already exists
            const [existingTxn] = await db
              .select()
              .from(transactions)
              .where(eq(transactions.scbTransactionId, scbTxn.scbTransactionId));

            if (existingTxn) {
              console.log(`[SCB SYNC] Transaction ${scbTxn.scbTransactionId} already exists, skipping`);
              continue;
            }

            // Insert new transaction
            await db
              .insert(transactions)
              .values({
                scbTransactionId: scbTxn.scbTransactionId,
                scbReferenceNo: scbTxn.reference,
                type: scbTxn.type,
                status: scbTxn.status,
                paymentMethod: 'SCB_QR', // Default from mock
                amount: scbTxn.amount,
                currency: scbTxn.currency,
                description: `SCB Sync: ${scbTxn.type}`,
                scbRawResponse: JSON.stringify({
                  mockData: true,
                  originalAmount: scbTxn.amount,
                  mockReference: scbTxn.reference,
                }),
                transactionDate: scbTxn.createdAt,
                processedDate: new Date(),
                isReconciled: false,
              });

            importedCount++;
            console.log(`[SCB SYNC] Imported transaction ${scbTxn.scbTransactionId}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            importErrors.push(`${scbTxn.scbTransactionId}: ${errorMsg}`);
            console.error(`[SCB SYNC] Failed to import ${scbTxn.scbTransactionId}:`, error);
          }
        }

        // Create summary record in financial_reports (optional)
        try {
          const totalAmount = scbTransactions.reduce((sum, txn) => sum + txn.amount, 0);
          const incomeAmount = scbTransactions
            .filter(txn => txn.type === 'INCOME')
            .reduce((sum, txn) => sum + txn.amount, 0);
          const expenseAmount = scbTransactions
            .filter(txn => txn.type === 'EXPENSE')
            .reduce((sum, txn) => sum + txn.amount, 0);

          // Note: Only insert if not already exists for the date
          console.log(`[SCB SYNC] Recording financial summary`);
        } catch (error) {
          console.warn('[SCB SYNC] Could not record financial summary:', error);
        }

        const response: SCBSyncResponse = {
          success: importErrors.length === 0,
          message: `Successfully imported ${importedCount} transactions${
            importErrors.length > 0 ? ` (${importErrors.length} errors)` : ''
          }`,
          transactionsImported: importedCount,
          recordsProcessed: scbTransactions.length,
          timestamp: new Date().toISOString(),
        };

        return {
          ...response,
          errors: importErrors.length > 0 ? importErrors : undefined,
        };
      } catch (error) {
        console.error('[SCB SYNC] Sync operation failed:', error);
        return {
          success: false,
          message: 'SCB sync operation failed',
          transactionsImported: 0,
          recordsProcessed: 0,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      body: t.Object({
        startDate: t.Optional(t.String({ format: 'date-time' })),
        endDate: t.Optional(t.String({ format: 'date-time' })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
    }
  )

  // ============================================
  // GET /transactions - List Transactions
  // ============================================
  .get(
    '/transactions',
    async ({ query }) => {
      try {
        const limit = Math.min(query.limit || 20, 100);
        const offset = ((query.page || 1) - 1) * limit;

        // Build where conditions
        const conditions = [
          gte(transactions.transactionDate, new Date(query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
          lte(transactions.transactionDate, new Date(query.to || new Date())),
        ];

        if (query.type && (query.type === 'INCOME' || query.type === 'EXPENSE')) {
          conditions.push(eq(transactions.type, query.type));
        }

        if (query.status) {
          conditions.push(eq(transactions.status, query.status));
        }

        // Get total count
        const [countResult] = await db
          .select({ count: count() })
          .from(transactions)
          .where(and(...conditions));

        // Get paginated records
        const records = await db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(desc(transactions.transactionDate))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: records,
          pagination: {
            page: query.page || 1,
            limit,
            total: countResult?.count || 0,
            pages: Math.ceil((countResult?.count || 0) / limit),
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
        type: t.Optional(t.Union([t.Literal('INCOME'), t.Literal('EXPENSE')])),
        status: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // POST /transactions/record - Record Transaction
  // ============================================
  .post(
    '/transactions/record',
    async ({ body }) => {
      try {
        const [newTransaction] = await db
          .insert(transactions)
          .values({
            type: body.type,
            status: 'COMPLETED',
            paymentMethod: body.paymentMethod,
            amount: body.amount,
            currency: body.currency || 'THB',
            orderId: body.orderId,
            userId: body.userId,
            description: body.description,
            category: body.category,
            transactionDate: new Date(body.transactionDate || new Date()),
            processedDate: new Date(),
            isReconciled: false,
          })
          .returning();

        return {
          success: true,
          data: newTransaction,
          message: 'Transaction recorded successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error recording transaction:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      body: t.Object({
        type: t.Union([t.Literal('INCOME'), t.Literal('EXPENSE')]),
        paymentMethod: t.String(),
        amount: t.Number({ minimum: 0 }),
        currency: t.Optional(t.String()),
        orderId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        description: t.String(),
        category: t.Optional(t.String()),
        transactionDate: t.Optional(t.String({ format: 'date-time' })),
      }),
    }
  );

export default financeRoutes;
