import { Elysia } from 'elysia';
import { FinanceController } from './controllers';

export function createFinanceRoutes() {
  const financeController = new FinanceController();

  return (new Elysia({ prefix: '/finance' }) as unknown as Elysia)
    // Payments
    .post('/payments', (ctx) => financeController.createPayment(ctx.body))
    .get('/payments/:id', (ctx) => financeController.getPayment(ctx.params))
    .get('/orders/:orderId/payments', (ctx) => financeController.getOrderPayments(ctx.params))
    // SCB Integration
    .post('/payments/scb/initiate', (ctx) => financeController.initiateScbPayment(ctx.body))
    .post('/payments/scb/callback', (ctx) => financeController.handleScbCallback(ctx.body))
    // Invoices
    .post('/invoices', (ctx) => financeController.generateInvoice(ctx.body))
    // Reports
    .get('/reports/p-and-l', (ctx) => financeController.getProfitLossReport(ctx.query));
}
