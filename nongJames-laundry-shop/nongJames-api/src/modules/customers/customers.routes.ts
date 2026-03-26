import { Elysia, t } from 'elysia';
import { CustomersController } from './controllers/customers.controller';
import { requireRole, requireAuth } from '../../middlewares/auth.middleware';

export function createCustomersRoutes() {
  const customersController = new CustomersController();

  return new Elysia({ prefix: '/api/customers' })

    // ═══════════════════════════════════════════════════════════════════
    // CUSTOMER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    // List customers - Admin/Staff only
    .get('/', (ctx) => customersController.listCustomers(ctx.query, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      query: t.Object({
        customerType: t.Optional(t.Union([
          t.Literal('INDIVIDUAL'),
          t.Literal('BUSINESS'),
          t.Literal('B2B'),
        ])),
        search: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    })

    // Get customer - Admin/Staff only
    .get('/:id', (ctx) => customersController.getCustomer(ctx.params, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
    })

    // Create customer - Admin/Staff only
    .post('/', (ctx) => customersController.createCustomer(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.Optional(t.String({ format: 'email' })),
        phone: t.Optional(t.String()),
        customerType: t.Optional(t.Union([
          t.Literal('INDIVIDUAL'),
          t.Literal('BUSINESS'),
          t.Literal('B2B'),
        ])),
        address: t.Optional(t.String()),
        city: t.Optional(t.String()),
        postalCode: t.Optional(t.String()),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
        companyName: t.Optional(t.String()),
        taxId: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    })

    // Update customer - Admin/Staff only
    .patch('/:id', (ctx) => customersController.updateCustomer(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String({ format: 'email' })),
        phone: t.Optional(t.String()),
        customerType: t.Optional(t.Union([
          t.Literal('INDIVIDUAL'),
          t.Literal('BUSINESS'),
          t.Literal('B2B'),
        ])),
        address: t.Optional(t.String()),
        city: t.Optional(t.String()),
        postalCode: t.Optional(t.String()),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
        companyName: t.Optional(t.String()),
        taxId: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        membershipLevel: t.Optional(t.String()),
      }),
    })

    // Deactivate customer - Admin only
    .delete('/:id', (ctx) => customersController.deleteCustomer(ctx.params, ctx), {
      beforeHandle: [requireRole(['ADMIN'])],
      params: t.Object({ id: t.String() }),
    })

    // ═══════════════════════════════════════════════════════════════════
    // CUSTOMER ORDERS
    // ═══════════════════════════════════════════════════════════════════

    // Get customer orders - Admin/Staff only
    .get('/:id/orders', (ctx) => customersController.getCustomerOrders(ctx.params, ctx.query, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    })

    // ═══════════════════════════════════════════════════════════════════
    // LOYALTY PROGRAM
    // ═══════════════════════════════════════════════════════════════════

    // Add loyalty points - Admin/Staff only
    .post('/:id/loyalty', (ctx) => customersController.addLoyaltyPoints(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        points: t.Number({ minimum: 1 }),
      }),
    });
}
