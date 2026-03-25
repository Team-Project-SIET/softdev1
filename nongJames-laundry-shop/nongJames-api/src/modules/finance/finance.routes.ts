import { Elysia, t } from 'elysia';
import { FinanceController } from './controllers';
import { authPlugin, requireRole } from '../../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createFinanceRoutes() {
  const financeController = new FinanceController();

  return new Elysia({ prefix: '/api/finance' })
    .use(authPlugin(JWT_SECRET))

    // ═══════════════════════════════════════════════════════════════════
    // PAYMENT ROUTES
    // ═══════════════════════════════════════════════════════════════════

    // Create payment record
    .post('/payments', (ctx) => financeController.createPayment(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        orderId: t.String(),
        amount: t.Number(),
        method: t.Union([
          t.Literal('promptpay_qr'),
          t.Literal('truewallet'),
          t.Literal('scb_easy'),
          t.Literal('omise_card'),
        ]),
        referenceId: t.Optional(t.String()),
      }),
    })

    // Get payment by ID
    .get('/payments/:id', (ctx) => financeController.getPayment(ctx.params, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
    })

    // Get payments for an order
    .get('/orders/:orderId/payments', (ctx) => financeController.getOrderPayments(ctx.params, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ orderId: t.String() }),
    })

    // ═══════════════════════════════════════════════════════════════════
    // SCB INTEGRATION ROUTES
    // ═══════════════════════════════════════════════════════════════════

    // Initiate SCB payment
    .post('/payments/scb/initiate', (ctx) => financeController.initiateScbPayment(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        orderId: t.String(),
        amount: t.Number(),
      }),
    })

    // Handle SCB callback (no auth required - called by SCB)
    .post('/payments/scb/callback', (ctx) => financeController.handleScbCallback(ctx.body), {
      body: t.Object({
        paymentId: t.String(),
        status: t.String(),
        transactionRef: t.Optional(t.String()),
      }),
    })

    // Sync SCB transactions
    .post('/transactions/sync', (ctx) => financeController.syncScbTransactions(ctx), {
      beforeHandle: [requireRole(['ADMIN'])],
    })

    // Get bank transactions
    .get('/transactions', (ctx) => financeController.getTransactions(ctx), {
      beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
    })

    // ═══════════════════════════════════════════════════════════════════
    // EXPENSE ROUTES
    // ═══════════════════════════════════════════════════════════════════

    // Create expense
    .post('/expenses', (ctx) => financeController.createExpense(ctx.body, ctx.user, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        category: t.Union([
          t.Literal('utilities'),
          t.Literal('salary'),
          t.Literal('supplies'),
          t.Literal('maintenance'),
          t.Literal('other'),
        ]),
        amount: t.Number(),
        description: t.Optional(t.String()),
        expenseDate: t.Optional(t.String()),
        receiptUrl: t.Optional(t.String()),
      }),
    })

    // Get expenses
    .get('/expenses', (ctx) => financeController.getExpenses(ctx), {
      beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
    })

    // ═══════════════════════════════════════════════════════════════════
    // INVOICE ROUTES
    // ═══════════════════════════════════════════════════════════════════

    // Generate invoice
    .post('/invoices', (ctx) => financeController.generateInvoice(ctx.body), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        orderId: t.String(),
      }),
    })

    // ═══════════════════════════════════════════════════════════════════
    // REPORTING ROUTES
    // ═══════════════════════════════════════════════════════════════════

    // Executive Dashboard - Profit/Loss report
    .get('/reports/p-and-l', (ctx) => financeController.getProfitLossReport(ctx.query), {
      beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    })

    // Dashboard summary (convenience endpoint)
    .get('/dashboard', (ctx) => financeController.getProfitLossReport(ctx.query), {
      beforeHandle: [requireRole(['ADMIN', 'EXECUTIVE'])],
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    });
}
