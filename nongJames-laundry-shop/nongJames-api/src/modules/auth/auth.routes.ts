import { Elysia, t } from 'elysia';
import { AuthController } from './controllers';
import { authPlugin, requireAuth } from '../../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createAuthRoutes() {
  const authController = new AuthController();

  return new Elysia({ prefix: '/api/auth' })
    // Login - no auth required
    .post('/login', (ctx) => authController.login(ctx.body, ctx.jwt, ctx), {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
    })

    // Register - no auth required
    .post('/register', (ctx) => authController.register(ctx.body, ctx.jwt, ctx), {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.Union([
          t.Literal('ADMIN'),
          t.Literal('STAFF'),
          t.Literal('DRIVER'),
          t.Literal('CUSTOMER'),
        ])),
      }),
    })

    // Refresh token - no auth required
    .post('/refresh', (ctx) => authController.refreshToken(ctx.body, ctx.jwt, ctx), {
      body: t.Object({
        refreshToken: t.String(),
      }),
    })

    // Protected routes below
    // NOTE: authPlugin is already applied globally in app.ts, no need to apply again
    // .use(authPlugin(JWT_SECRET))

    // Logout - requires auth
    .post('/logout', (ctx) => authController.logout(ctx), {
      beforeHandle: [requireAuth],
    })

    // Get profile - requires auth
    .get('/profile', (ctx) => authController.getProfile(ctx.user, ctx), {
      beforeHandle: [requireAuth],
    });
}
