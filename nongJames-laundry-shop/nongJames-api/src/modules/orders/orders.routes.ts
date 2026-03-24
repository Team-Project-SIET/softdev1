import { Elysia } from 'elysia';
import { OrdersController } from './controllers';

export function createOrderRoutes() {
  const ordersController = new OrdersController();

  return (new Elysia({ prefix: '/orders' }) as unknown as Elysia)
    .post('/', (ctx) => ordersController.createOrder(ctx.body, ctx))
    .get('/', (ctx) => ordersController.listOrders(ctx.query, ctx))
    .get('/:id', (ctx) => ordersController.getOrder(ctx.params, ctx))
    .patch('/:id', (ctx) => ordersController.updateOrder(ctx.params, ctx.body, ctx))
    .delete('/:id', (ctx) => ordersController.deleteOrder(ctx.params, ctx))
    .post('/:id/status', (ctx) => ordersController.transitionOrder(ctx.params, ctx.body, ctx))
    .get('/:id/history', (ctx) => ordersController.getWorkflowHistory(ctx.params, ctx));
}
