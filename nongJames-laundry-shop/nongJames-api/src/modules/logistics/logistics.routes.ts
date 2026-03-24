import { Elysia, t } from 'elysia';
import { LogisticsController } from './controllers';
import { authPlugin, requireRole } from '../../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createLogisticsRoutes() {
  const logisticsController = new LogisticsController();

  return new Elysia({ prefix: '/logistics' })
    .use(authPlugin(JWT_SECRET))

    // Driver management - Admin only
    .post('/drivers', (ctx) => logisticsController.createDriver(ctx.body), {
      beforeHandle: [requireRole(['admin'])],
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        phone: t.Optional(t.String()),
      }),
    })
    .get('/drivers', (ctx) => logisticsController.listDrivers(ctx.query), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      query: t.Object({
        limit: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    })
    .get('/drivers/:id', (ctx) => logisticsController.getDriver(ctx.params), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      params: t.Object({ id: t.String() }),
    })

    // Order assignments - Admin/Staff
    .post('/assignments', (ctx) => logisticsController.assignOrder(ctx.body), {
      beforeHandle: [requireRole(['admin', 'staff'])],
      body: t.Object({
        orderId: t.String(),
        driverId: t.String(),
        taskType: t.Union([t.Literal('pickup'), t.Literal('delivery')]),
        notes: t.Optional(t.String()),
      }),
    })
    .get('/drivers/:driverId/assignments', (ctx) => logisticsController.getAssignments(ctx.params), {
      beforeHandle: [requireRole(['admin', 'staff', 'driver'])],
      params: t.Object({ driverId: t.String() }),
    })

    // Task status updates - Driver/Admin
    .patch('/tasks/:id/status', (ctx) => logisticsController.updateTaskStatus(ctx.params, ctx.body, ctx), {
      beforeHandle: [requireRole(['driver', 'admin'])],
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.Union([
          t.Literal('in_progress'),
          t.Literal('completed'),
          t.Literal('cancelled'),
        ]),
      }),
    })

    // Tracking - All authenticated users
    .get('/orders/:orderId/status', (ctx) => logisticsController.getDeliveryStatus(ctx.params), {
      beforeHandle: [requireRole(['admin', 'staff', 'driver', 'customer'])],
      params: t.Object({ orderId: t.String() }),
    })

    // Driver location updates
    .post('/drivers/:driverId/location', (ctx) => logisticsController.updateLocation(ctx.body, ctx), {
      beforeHandle: [requireRole(['driver'])],
      params: t.Object({ driverId: t.String() }),
      body: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
      }),
    });
}
