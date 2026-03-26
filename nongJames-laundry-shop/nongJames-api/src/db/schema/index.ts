/**
 * Drizzle ORM Schema Export Index
 * Centralized export for all database tables
 */

// Users & Authentication
export * from './users';
export * from './oauth-accounts';

// Orders & Workflow
export {
  orders,
  orderStatusEnum,
  orderTypeEnum,
  deliveryTypeEnum,
  paymentStatusEnum as ordersPaymentStatusEnum
} from './orders';
export * from './order-items';
export * from './order-workflow';

// Customers
export * from './customers';

// Logistics & Delivery
export * from './logistics';
export * from './driver-tasks';

// Payments & Invoicing — exclude duplicate enums
export { payments } from './payments';
export {
  paymentStatusEnum as paymentsPaymentStatusEnum,
  paymentMethodEnum as paymentsPaymentMethodEnum
} from './payments';

// Financial Management — exclude duplicate enums
export {
  transactions,
  transactionTypeEnum,
  transactionStatusEnum
} from './transactions';
export * from './finance';
export * from './expenses';

// B2B Contracts
export * from './contracts';

// Services Catalog
export * from './services';

// Notifications & Communication
export * from './notifications';