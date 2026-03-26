import { Elysia, t } from 'elysia';
import { ServicesController } from './controllers/services.controller';
import { requireRole } from '../../middlewares/auth.middleware';

export function createServicesRoutes() {
  const servicesController = new ServicesController();

  return new Elysia({ prefix: '/api/services' })

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC / CUSTOMER ENDPOINTS (Any authenticated user)
    // ═══════════════════════════════════════════════════════════════════

    // List active services (no auth required for viewing catalog)
    .get('/', (ctx) => servicesController.listServices(ctx.query, ctx), {
      query: t.Object({
        category: t.Optional(t.Union([
          t.Literal('WASH'),
          t.Literal('DRY_CLEAN'),
          t.Literal('SPECIAL_CARE'),
          t.Literal('RUSH_SERVICE'),
          t.Literal('ADDITIONAL_SERVICE'),
        ])),
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    })

    // Get service details
    .get('/:id', (ctx) => servicesController.getService(ctx.params, ctx), {
      params: t.Object({ id: t.String() }),
    })

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN/STAFF ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    // Create service - Admin/Staff only
    .post('/', (ctx) => servicesController.createService(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        category: t.Union([
          t.Literal('WASH'),
          t.Literal('DRY_CLEAN'),
          t.Literal('SPECIAL_CARE'),
          t.Literal('RUSH_SERVICE'),
          t.Literal('ADDITIONAL_SERVICE'),
        ]),
        basePrice: t.Number({ minimum: 0 }),
        pricePerKg: t.Optional(t.Number({ minimum: 0 })),
        pricePerItem: t.Optional(t.Number({ minimum: 0 })),
        applicableItemTypes: t.Optional(t.String()),
        estimatedDays: t.Optional(t.Number({ minimum: 1 })),
        isRushAvailable: t.Optional(t.Boolean()),
        rushPrice: t.Optional(t.Number({ minimum: 0 })),
        icon: t.Optional(t.String()),
        color: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
      }),
    })

    // Update service - Admin/Staff only
    .patch('/:id', (ctx) => servicesController.updateService(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        category: t.Optional(t.Union([
          t.Literal('WASH'),
          t.Literal('DRY_CLEAN'),
          t.Literal('SPECIAL_CARE'),
          t.Literal('RUSH_SERVICE'),
          t.Literal('ADDITIONAL_SERVICE'),
        ])),
        basePrice: t.Optional(t.Number({ minimum: 0 })),
        pricePerKg: t.Optional(t.Number({ minimum: 0 })),
        pricePerItem: t.Optional(t.Number({ minimum: 0 })),
        applicableItemTypes: t.Optional(t.String()),
        estimatedDays: t.Optional(t.Number({ minimum: 1 })),
        isRushAvailable: t.Optional(t.Boolean()),
        rushPrice: t.Optional(t.Number({ minimum: 0 })),
        icon: t.Optional(t.String()),
        color: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        displayOrder: t.Optional(t.Number()),
      }),
    })

    // Deactivate service - Admin only
    .delete('/:id', (ctx) => servicesController.deleteService(ctx.params, ctx), {
      beforeHandle: [requireRole(['ADMIN'])],
      params: t.Object({ id: t.String() }),
    })

    // ═══════════════════════════════════════════════════════════════════
    // PRICING RULES ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    // Create pricing rule - Admin/Staff only
    .post('/:id/pricing-rules', (ctx) => servicesController.createPricingRule(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        ruleType: t.String({ minLength: 1 }),
        minQuantity: t.Optional(t.Number()),
        maxQuantity: t.Optional(t.Number()),
        applicableMembership: t.Optional(t.String()),
        discountType: t.Optional(t.String()),
        discountValue: t.Number({ minimum: 0 }),
        validFrom: t.Optional(t.String()),
        validUntil: t.Optional(t.String()),
      }),
    });
}
