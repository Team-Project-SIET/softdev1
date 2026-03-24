import { Elysia, t } from 'elysia';
import { OrdersController } from './controllers';
import { authPlugin, requireRole, requireAuth } from '../../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createOrderRoutes() {
  const ordersController = new OrdersController();

  return new Elysia({ prefix: '/orders' })
    .use(authPlugin(JWT_SECRET))

    // Create order - Admin/Staff only
    .post('/', (ctx) => ordersController.createOrder(ctx.body, ctx), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      body: t.Object({
        customerId: t.String(),
        orderType: t.Union([t.Literal('b2c'), t.Literal('b2b')]),
        pickupAddress: t.Optional(t.String()),
        deliveryAddress: t.Optional(t.String()),
        items: t.Array(t.Object({
          serviceId: t.String(),
          quantity: t.Number(),
          unitPrice: t.Number(),
        })),
        notes: t.Optional(t.String()),
      }),
    })

    // List all orders - Admin/Staff
    .get('/', (ctx) => ordersController.listOrders(ctx.query, ctx), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      query: t.Object({
        status: t.Optional(t.String()),
        customerId: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    })

    // Get order details - Any authenticated user
    .get('/:id', (ctx) => ordersController.getOrder(ctx.params, ctx), {
      beforeHandle: [requireAuth],
      params: t.Object({ id: t.String() }),
    })

    // Update order - Admin/Staff only
    .patch('/:id', (ctx) => ordersController.updateOrder(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        pickupAddress: t.Optional(t.String()),
        deliveryAddress: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    })

    // Delete order - Admin only
    .delete('/:id', (ctx) => ordersController.deleteOrder(ctx.params, ctx), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      params: t.Object({ id: t.String() }),
    })

    // Transition order status - Admin/Staff/Driver
    .post('/:id/status', (ctx) => ordersController.transitionOrder(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['admin', 'staff', 'driver'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.Union([
          t.Literal('pending_pickup'),
          t.Literal('washing'),
          t.Literal('packing'),
          t.Literal('ready_for_delivery'),
          t.Literal('completed'),
          t.Literal('cancelled'),
        ]),
        note: t.Optional(t.String()),
      }),
    })

    // Get order history - Any authenticated user
    .get('/:id/history', (ctx) => ordersController.getWorkflowHistory(ctx.params, ctx), {
      beforeHandle: [requireAuth],
      params: t.Object({ id: t.String() }),
    });
}
