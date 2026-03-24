import { Elysia } from 'elysia';
import { AuthController } from './controllers';

export function createAuthRoutes() {
  const authController = new AuthController();

  return (new Elysia({ prefix: '/auth' }) as unknown as Elysia)
    .post('/login', (ctx) => authController.login(ctx.body))
    .post('/register', (ctx) => authController.register(ctx.body))
    .post('/refresh', (ctx) => authController.refreshToken(ctx.body, ctx))
    .post('/logout', (ctx) => authController.logout(ctx))
    .get('/profile', (ctx) => authController.getProfile(ctx));
}
