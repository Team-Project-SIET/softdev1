/**
 * Main Application Entry Point Example
 * Shows how to integrate the Finance Routes with other application features
 * 
 * File: src/app.ts or src/index.ts
 */

import Elysia, { NotFoundError } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { logger } from '@elysiajs/logger';

// Database
import { checkDatabaseConnection } from '@/db';

// Routes
import { financeRoutes } from '@/routes/finance';
// Future routes:
// import { orderRoutes } from '@/routes/orders';
// import { logisticsRoutes } from '@/routes/logistics';
// import { authRoutes } from '@/routes/auth';
// import { notificationRoutes } from '@/routes/notifications';

// Middleware
import { authMiddleware } from '@/middlewares/auth';
import { errorHandler } from '@/middlewares/error-handler';
import { requestLogger } from '@/middlewares/request-logger';

// Initialize Elysia app
const app = new Elysia();

// ============================================
// Global Middleware
// ============================================

// Enable CORS
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// API Documentation (Swagger)
app.use(
  swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'NongJames Laundry Management API',
        version: '2.4.0',
        description: 'Financial, Order, and Logistics Management System',
        contact: {
          name: 'Development Team',
        },
      },
      tags: [
        {
          name: 'Finance',
          description: 'Financial dashboard and transaction management',
        },
        {
          name: 'Orders',
          description: 'Order management and workflow',
        },
        {
          name: 'Logistics',
          description: 'Driver and delivery management',
        },
        {
          name: 'Auth',
          description: 'Authentication and authorization',
        },
      ],
    },
  })
);

// Request logging
app.use(logger());

// ============================================
// Database Connection
// ============================================

app.before(async () => {
  console.log('🔄 Checking database connection...');
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    console.error('❌ Database connection failed!');
    throw new Error('Database connection failed. Check DATABASE_URL in .env');
  }
  
  console.log('✅ Database connected successfully');
});

// ============================================
// Health Check Endpoint
// ============================================

app.get('/api/health', () => ({
  status: 'ok',
  service: 'NongJames Laundry API',
  version: '2.4.0',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

// ============================================
// Route Registration
// ============================================

// Finance Routes (No auth required for demo)
app.use(financeRoutes);

// Other routes would be registered here:
// app.use(authRoutes);                    // Auth routes (public)
// app.use(authMiddleware);                 // Protect subsequent routes
// app.use(orderRoutes);                    // Protected order routes
// app.use(logisticsRoutes);                // Protected logistics routes
// app.use(notificationRoutes);             // Protected notification routes

// ============================================
// Root Endpoint
// ============================================

app.get('/', () => ({
  message: 'Welcome to NongJames Laundry API v2.4',
  endpoints: {
    docs: '/docs',
    health: '/api/health',
    finance: {
      dashboard: 'GET /api/finance/dashboard/summary',
      scbSync: 'POST /api/finance/scb/sync',
      transactions: 'GET /api/finance/transactions',
      record: 'POST /api/finance/transactions/record',
    },
  },
  timestamp: new Date().toISOString(),
}));

// ============================================
// 404 Handler
// ============================================

app.onError(({ code, error, path }) => {
  if (code === 'NOT_FOUND') {
    return {
      success: false,
      error: 'Endpoint not found',
      path: path,
      timestamp: new Date().toISOString(),
      availableEndpoints: '/api/health or /docs for documentation',
    };
  }

  console.error(`[ERROR] ${code}:`, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Internal server error',
    timestamp: new Date().toISOString(),
  };
});

// ============================================
// Start Server
// ============================================

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, hostname: HOST }, (server) => {
  console.log(`
╔════════════════════════════════════════════╗
║   🎵 NongJames Laundry API v2.4            ║
║   Running on http://${HOST}:${PORT}               ║
║   Docs at http://${HOST}:${PORT}/docs             ║
╚════════════════════════════════════════════╝
  `);

  console.log('📚 Available Routes:');
  console.log('  📊 Finance Dashboard   : GET /api/finance/dashboard/summary');
  console.log('  🔄 SCB Sync            : POST /api/finance/scb/sync');
  console.log('  💳 Transactions        : GET /api/finance/transactions');
  console.log('  ➕ Record Transaction  : POST /api/finance/transactions/record');
  console.log('  📖 API Documentation   : GET /docs');
});

export default app;

/**
 * INTEGRATION CHECKLIST:
 * 
 * ✅ 1. Finance Routes integrated
 * ⬜ 2. Auth Routes to be integrated
 * ⬜ 3. Order Routes to be integrated
 * ⬜ 4. Logistics Routes to be integrated
 * ⬜ 5. Notification Routes to be integrated
 * 
 * CUSTOMIZATION OPTIONS:
 * 
 * - Modify PORT/HOST for different deployment
 * - Enable/disable routes based on environment
 * - Configure CORS origin list
 * - Add rate limiting middleware
 * - Enable request/response logging
 * - Setup error tracking (Sentry)
 * - Configure performance monitoring (APM)
 * 
 * ENVIRONMENT VARIABLES NEEDED:
 * 
 * DATABASE_URL=postgresql://...
 * PORT=3001
 * HOST=0.0.0.0
 * NODE_ENV=development
 * 
 * JWT_SECRET=your-secret-key
 * JWT_EXPIRY=7d
 * 
 * SCB_API_KEY=...
 * SCB_API_SECRET=...
 * 
 * LINE_CHANNEL_ID=...
 * LINE_CHANNEL_SECRET=...
 */
