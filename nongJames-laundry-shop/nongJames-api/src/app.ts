import Elysia from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { bearer } from '@elysiajs/bearer';
import { jwt } from '@elysiajs/jwt';

// Module imports
import { createAuthRoutes } from './modules/auth';
import { createOrderRoutes } from './modules/orders';
import { createLogisticsRoutes } from './modules/logistics';
import { createFinanceRoutes } from './modules/finance';
import { createServicesRoutes } from './modules/services';
import { createCustomersRoutes } from './modules/customers';
import { createNotificationsRoutes } from './modules/notifications';

// Middleware imports
import { authPlugin, requireAuth, requireRole } from './middlewares/auth.middleware';

// Integrations
import { ScbClient } from './integrations/scb/scb.client';
import { LineClient } from './integrations/line/line.client';

// Common utilities
import { successResponse, errorResponse } from './common/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Main application setup with Elysia
 * Registers all module routes and middleware
 */
export function createApp(): Elysia {
  const app = new Elysia()
    // ────────────────────────────────────────────────────────
    // GLOBAL MIDDLEWARE
    // ────────────────────────────────────────────────────────
    .use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    }))
    .use(swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'NongJames Laundry Management API',
          version: '1.0.0',
          description: 'B2C & B2B Laundry Management System - Order Workflow, Logistics, Finance, SCB & LINE Integration',
        },
        tags: [
          { name: 'Auth', description: 'User authentication' },
          { name: 'Orders', description: 'Order management & workflow' },
          { name: 'Logistics', description: 'Driver & delivery management' },
          { name: 'Finance', description: 'Payments & invoicing' },
          { name: 'Webhooks', description: 'SCB & LINE event handlers' },
        ],
      },
    }))
    .use(bearer())
    .use(jwt({
      name: 'jwt',
      secret: JWT_SECRET,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }))
    // Auth plugin provides { user } context
    .use(authPlugin(JWT_SECRET))

    // ────────────────────────────────────────────────────────
    // REQUEST LOGGING MIDDLEWARE
    // ────────────────────────────────────────────────────────
    .onBeforeHandle(({ request }) => {
      const timestamp = new Date().toISOString();
      const method = request.method;
      const url = new URL(request.url).pathname;
      console.log(`[${timestamp}] ${method} ${url}`);
    })

    // ────────────────────────────────────────────────────────
    // ERROR HANDLING
    // ────────────────────────────────────────────────────────
    .onError(({ code, error, request }) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ERROR ${request.method} ${request.url}:`, error);
      
      return errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Internal server error',
        null
      );
    })

    // ────────────────────────────────────────────────────────
    // HEALTH & INFO ENDPOINTS
    // ────────────────────────────────────────────────────────
    .get('/health', () => ({
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    }))
    .get('/api/version', () => successResponse({ version: '1.0.0' }))
    .get('/api/info', () => successResponse({
      name: 'NongJames Laundry API',
      version: '1.0.0',
      features: [
        'User Authentication with JWT',
        'LINE Official Account Integration',
        'Order Management with Workflow',
        'Real-time Driver Logistics',
        'Financial Dashboard',
        'SCB Payment Integration',
      ],
    }))

    // ────────────────────────────────────────────────────────
    // MODULE ROUTES (with /api prefix)
    // ────────────────────────────────────────────────────────
    .use(createAuthRoutes())
    .use(createOrderRoutes())
    .use(createLogisticsRoutes())
    .use(createFinanceRoutes())
    .use(createServicesRoutes())
    .use(createCustomersRoutes())
    .use(createNotificationsRoutes())

    // ────────────────────────────────────────────────────────
    // WEBHOOK ENDPOINTS (SCB & LINE - No Auth Required)
    // ────────────────────────────────────────────────────────
    .post('/webhooks/scb/payment-callback', async ({ body, set }) => {
      try {
        console.log('[WEBHOOK] SCB Payment Callback:', body);
        const scbClient = new ScbClient();
        const isValid = await scbClient.verifyWebhookSignature(body as any);
        
        if (!isValid) {
          set.status = 401;
          return errorResponse('INVALID_SIGNATURE', 'SCB webhook signature verification failed');
        }

        // Process payment callback - implement in finance service
        console.log('[WEBHOOK] SCB callback processed successfully');
        return successResponse({ message: 'Webhook received' });
      } catch (error) {
        console.error('[WEBHOOK] SCB error:', error);
        set.status = 500;
        return errorResponse('WEBHOOK_ERROR', error instanceof Error ? error.message : 'Webhook processing failed');
      }
    })

    .post('/webhooks/line/events', async ({ body, headers, set }) => {
      try {
        console.log('[WEBHOOK] LINE Event:', body);
        const lineClient = new LineClient();
        const signature = headers['x-line-signature'] as string;
        
        if (!signature) {
          set.status = 401;
          return errorResponse('MISSING_SIGNATURE', 'Missing X-Line-Signature header');
        }

        // Verify LINE webhook signature
        const bodyString = JSON.stringify(body);
        const isValid = await lineClient.verifyWebhookSignature(signature, bodyString);
        
        if (!isValid) {
          set.status = 401;
          return errorResponse('INVALID_SIGNATURE', 'LINE webhook signature verification failed');
        }

        // Process LINE events
        await lineClient.handleWebhookEvent(body as any);
        
        console.log('[WEBHOOK] LINE event processed successfully');
        return successResponse({ message: 'Webhook received' });
      } catch (error) {
        console.error('[WEBHOOK] LINE error:', error);
        set.status = 500;
        return errorResponse('WEBHOOK_ERROR', error instanceof Error ? error.message : 'Webhook processing failed');
      }
    })

    // ────────────────────────────────────────────────────────
    // 404 CATCH-ALL (MUST BE LAST)
    // ────────────────────────────────────────────────────────
    .all('*', ({ set }) => {
      set.status = 404;
      return errorResponse('NOT_FOUND', 'Route not found');
    });

  return app;
}

export { authPlugin, requireAuth, requireRole };
export { ScbClient, LineClient };
