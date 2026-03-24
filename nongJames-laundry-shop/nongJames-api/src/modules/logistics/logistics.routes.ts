import { Elysia } from 'elysia';
import { LogisticsController } from './controllers';

export function createLogisticsRoutes() {
  const logisticsController = new LogisticsController();

  return (new Elysia({ prefix: '/logistics' }) as unknown as Elysia)
    // Driver management
    .post('/drivers', (ctx) => logisticsController.createDriver(ctx.body))
    .get('/drivers', (ctx) => logisticsController.listDrivers(ctx.query))
    .get('/drivers/:id', (ctx) => logisticsController.getDriver(ctx.params))
    // Order assignments
    .post('/assignments', (ctx) => logisticsController.assignOrder(ctx.body))
    .get('/drivers/:driverId/assignments', (ctx) => logisticsController.getAssignments(ctx.params))
    // Tracking
    .get('/orders/:orderId/status', (ctx) => logisticsController.getDeliveryStatus(ctx.params))
    .post('/drivers/:driverId/location', (ctx) => logisticsController.updateLocation(ctx.body, ctx));
}
