import { Elysia, t } from 'elysia';
import { NotificationsController } from './controllers/notifications.controller';
import { authPlugin, requireRole } from '../../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createNotificationsRoutes() {
  const notificationsController = new NotificationsController();

  return new Elysia({ prefix: '/api/notifications' })
    .use(authPlugin(JWT_SECRET))

    // ═══════════════════════════════════════════════════════════════════
    // NOTIFICATION ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    // Send custom notification to customer
    .post('/send', (ctx) => notificationsController.sendNotification(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF'])],
      body: t.Object({
        customerId: t.String(),
        orderId: t.Optional(t.String()),
        type: t.Optional(t.String()),
        message: t.Optional(t.String()),
      }),
    })

    // Send order status notification
    .post('/order-status', (ctx) => notificationsController.sendOrderStatusNotification(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN', 'STAFF', 'DRIVER'])],
      body: t.Object({
        orderId: t.String(),
        status: t.String(),
      }),
    })

    // Broadcast message to customers (Admin only)
    .post('/broadcast', (ctx) => notificationsController.broadcastMessage(ctx.body, ctx), {
      beforeHandle: [requireRole(['ADMIN'])],
      body: t.Object({
        message: t.String({ minLength: 1 }),
        customerType: t.Optional(t.Union([
          t.Literal('INDIVIDUAL'),
          t.Literal('BUSINESS'),
          t.Literal('B2B'),
        ])),
      }),
    });
}
