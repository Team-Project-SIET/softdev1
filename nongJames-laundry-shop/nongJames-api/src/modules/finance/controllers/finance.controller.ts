import { db, payments, orders, transactions, expenses, users, customers, invoices, financialReports } from '../../../db';
import { eq, and, gte, lte, desc, sum } from 'drizzle-orm';

/**
 * Finance Controller
 * Handles payment processing, SCB integration, and financial reporting
 */
export class FinanceController {
  constructor() {}

  /**
   * Create a payment record
   * POST /finance/payments
   */
  async createPayment(body: any) {
    try {
      const { orderId, amount, method, referenceId } = body;

      // Verify order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return { success: false, message: 'Order not found', data: null };
      }

      // Create payment record
      const paymentNumber = `PAY-${Date.now()}`;
      const [payment] = await db.insert(payments).values({
        orderId,
        paymentNumber,
        amount: amount.toString(),
        paymentMethod: method.toUpperCase().replace('_', '_') as any,
        status: 'PENDING',
        scbTransactionId: referenceId || null,
      }).returning();

      return {
        success: true,
        message: 'Payment record created',
        data: payment,
      };
    } catch (error) {
      console.error('[FinanceController] Create payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment',
        data: null,
      };
    }
  }

  /**
   * Get payment by ID
   * GET /finance/payments/:id
   */
  async getPayment(params: any) {
    try {
      const { id } = params;

      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, id))
        .limit(1);

      if (!payment) {
        return { success: false, message: 'Payment not found', data: null };
      }

      return {
        success: true,
        message: 'Payment retrieved',
        data: payment,
      };
    } catch (error) {
      console.error('[FinanceController] Get payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment',
        data: null,
      };
    }
  }

  /**
   * Get payments for an order
   * GET /finance/orders/:orderId/payments
   */
  async getOrderPayments(params: any) {
    try {
      const { orderId } = params;

      const orderPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(desc(payments.createdAt));

      return {
        success: true,
        message: 'Order payments retrieved',
        data: orderPayments,
      };
    } catch (error) {
      console.error('[FinanceController] Get order payments error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get order payments',
        data: null,
      };
    }
  }

  /**
   * Initiate SCB payment
   * POST /finance/payments/scb/initiate
   */
  async initiateScbPayment(body: any) {
    try {
      const { orderId, amount } = body;

      // Verify order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return { success: false, message: 'Order not found', data: null };
      }

      // Create payment record with SCB method
      const paymentNumber = `PAY-SCB-${Date.now()}`;
      const [payment] = await db.insert(payments).values({
        orderId,
        paymentNumber,
        amount: amount.toString(),
        paymentMethod: 'SCB_QR',
        status: 'PENDING',
      }).returning();

      // In production, this would call SCB API to generate QR code
      // For sandbox/demo, we return mock data
      const mockQrCode = `https://api.scb.co.th/qr/${payment.id}`;

      return {
        success: true,
        message: 'SCB payment initiated',
        data: {
          paymentId: payment.id,
          paymentUrl: mockQrCode,
          qrCode: mockQrCode,
          amount,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      };
    } catch (error) {
      console.error('[FinanceController] SCB initiate error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate SCB payment',
        data: null,
      };
    }
  }

  /**
   * Handle SCB payment callback
   * POST /finance/payments/scb/callback
   */
  async handleScbCallback(body: any) {
    try {
      const { paymentId, status, transactionRef } = body;

      const newStatus = status === 'success' ? 'COMPLETED' : 'FAILED';

      // Update payment status
      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: newStatus,
          scbTransactionId: transactionRef,
          completedAt: status === 'success' ? new Date() : null,
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // If payment successful, update order payment status
      if (status === 'success' && updatedPayment) {
        await db
          .update(orders)
          .set({ paymentStatus: 'paid', updatedAt: new Date() })
          .where(eq(orders.id, updatedPayment.orderId));
      }

      return {
        success: true,
        message: 'Callback processed',
        data: updatedPayment,
      };
    } catch (error) {
      console.error('[FinanceController] SCB callback error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process callback',
        data: null,
      };
    }
  }

  /**
   * Generate invoice
   * POST /finance/invoices
   */
  async generateInvoice(body: any) {
    try {
      const { orderId } = body;

      // Get order with customer details
      const [order] = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          totalAmount: orders.totalAmount,
          deliveryFee: orders.deliveryFee,
          discountAmount: orders.discount,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return { success: false, message: 'Order not found', data: null };
      }

      // Get customer info
      const [customer] = await db
        .select({
          name: customers.name,
          phone: customers.phone,
          address: customers.address,
        })
        .from(customers)
        .innerJoin(orders, eq(customers.id, orders.customerId))
        .where(eq(orders.id, orderId))
        .limit(1);

      // Get order items
      const items = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId));

      const subtotal = parseFloat(order.totalAmount?.toString() || '0');
      const deliveryFee = parseFloat(order.deliveryFee?.toString() || '0');
      const discount = parseFloat(order.discountAmount?.toString() || '0');

      const invoice = {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderId: order.id,
        customer: customer || {
          name: 'Unknown',
          phone: null,
          address: null,
        },
        items,
        subtotal,
        deliveryFee,
        discount,
        total: subtotal + deliveryFee - discount,
        issuedAt: new Date(),
      };

      return {
        success: true,
        message: 'Invoice generated',
        data: invoice,
      };
    } catch (error) {
      console.error('[FinanceController] Generate invoice error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate invoice',
        data: null,
      };
    }
  }

  /**
   * Get profit/loss report (Executive Dashboard)
   * GET /finance/reports/p-and-l
   */
  async getProfitLossReport(query: any) {
    try {
      const { startDate, endDate } = query;

      const now = new Date();
      const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Calculate income (successful payments)
      const incomeResult = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(and(
          eq(payments.status, 'COMPLETED'),
          gte(payments.completedAt, start),
          lte(payments.completedAt, end)
        ));

      const income = Number(incomeResult[0]?.total || 0);

      // Calculate expenses
      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(
          gte(expenses.expenseDate, start.toISOString().slice(0, 10)),
          lte(expenses.expenseDate, end.toISOString().slice(0, 10))
        ));

      const expenseTotal = Number(expenseResult[0]?.total || 0);

      // Get expenses by category
      const expensesByCategory = await db
        .select({
          category: expenses.category,
          total: sum(expenses.amount),
        })
        .from(expenses)
        .where(and(
          gte(expenses.expenseDate, start.toISOString().slice(0, 10)),
          lte(expenses.expenseDate, end.toISOString().slice(0, 10))
        ))
        .groupBy(expenses.category);

      const profit = income - expenseTotal;

      return {
        success: true,
        message: 'Profit/loss report generated',
        data: {
          period: {
            start: start.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
          },
          income,
          expenses: expenseTotal,
          profit,
          expensesByCategory: expensesByCategory.map(e => ({
            category: e.category,
            amount: Number(e.total || 0),
          })),
        },
      };
    } catch (error) {
      console.error('[FinanceController] P&L report error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate report',
        data: null,
      };
    }
  }

  /**
   * Sync SCB transactions
   * POST /finance/transactions/sync
   */
  async syncScbTransactions() {
    try {
      // In production, this would call SCB API
      // For demo, create mock transactions
      const mockTransactions = [
        {
          scbTransactionId: `SCB-${Date.now()}-1`,
          type: 'INCOME' as const,
          status: 'COMPLETED' as const,
          paymentMethod: 'SCB_QR' as const,
          amount: '1500.00',
          description: 'Payment for order NJ-20240324-001',
          transactionDate: new Date(),
        },
        {
          scbTransactionId: `SCB-${Date.now()}-2`,
          type: 'EXPENSE' as const,
          status: 'COMPLETED' as const,
          paymentMethod: 'BANK_TRANSFER' as const,
          amount: '500.00',
          description: 'Utility bill payment',
          transactionDate: new Date(),
        },
      ];

      let newCount = 0;
      for (const tx of mockTransactions) {
        // Check if transaction already exists
        const [existing] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.scbTransactionId, tx.scbTransactionId))
          .limit(1);

        if (!existing) {
          await db.insert(transactions).values(tx);
          newCount++;
        }
      }

      return {
        success: true,
        message: `Synced ${newCount} new transactions`,
        data: { newCount },
      };
    } catch (error) {
      console.error('[FinanceController] SCB sync error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync transactions',
        data: null,
      };
    }
  }

  /**
   * Get bank transactions
   * GET /finance/transactions
   */
  async getTransactions() {
    try {
      const txnList = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.transactionDate));

      return {
        success: true,
        message: 'Transactions retrieved',
        data: txnList,
      };
    } catch (error) {
      console.error('[FinanceController] Get transactions error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transactions',
        data: null,
      };
    }
  }

  /**
   * Record an expense
   * POST /finance/expenses
   */
  async createExpense(body: any, user: any) {
    try {
      const { category, amount, description, expenseDate, receiptUrl } = body;

      if (!user) {
        return { success: false, message: 'Unauthorized', data: null };
      }

      const [expense] = await db.insert(expenses).values({
        category,
        amount: amount.toString(),
        description: description || null,
        expenseDate: expenseDate || new Date().toISOString().slice(0, 10),
        createdBy: user.id,
        receiptUrl: receiptUrl || null,
      }).returning();

      return {
        success: true,
        message: 'Expense recorded',
        data: expense,
      };
    } catch (error) {
      console.error('[FinanceController] Create expense error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to record expense',
        data: null,
      };
    }
  }

  /**
   * Get expenses
   * GET /finance/expenses
   */
  async getExpenses() {
    try {
      const expenseList = await db
        .select({
          id: expenses.id,
          category: expenses.category,
          amount: expenses.amount,
          description: expenses.description,
          expenseDate: expenses.expenseDate,
          receiptUrl: expenses.receiptUrl,
          createdBy: users.fullName,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.createdBy, users.id))
        .orderBy(desc(expenses.expenseDate));

      return {
        success: true,
        message: 'Expenses retrieved',
        data: expenseList,
      };
    } catch (error) {
      console.error('[FinanceController] Get expenses error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get expenses',
        data: null,
      };
    }
  }
}
