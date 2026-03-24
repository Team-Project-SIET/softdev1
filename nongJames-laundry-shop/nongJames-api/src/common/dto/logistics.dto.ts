import { t, Static } from 'elysia';

// ════════════════════════════════════════════════════════════════════════════
// DRIVER SCHEMAS & TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Schema for creating a driver
 */
export const CreateDriverSchema = t.Object({
  name: t.String({ minLength: 1, description: 'Driver full name' }),
  phone: t.String({ minLength: 9, description: 'Driver phone number' }),
  email: t.String({ format: 'email', description: 'Driver email' }),
  licenseNumber: t.String({ minLength: 1, description: 'License plate number' }),
  vehicleType: t.Optional(
    t.String({ description: 'Type of vehicle (motorcycle, car, truck, etc.)' })
  ),
});

/**
 * TypeScript interface for driver creation
 */
export type CreateDriver = Static<typeof CreateDriverSchema>;

/**
 * Schema for driver response
 */
export const DriverResponseSchema = t.Object({
  id: t.String({ description: 'Driver ID' }),
  userId: t.String({ description: 'User ID (for authentication)' }),
  name: t.String({ description: 'Driver full name' }),
  phone: t.String({ description: 'Driver phone number' }),
  email: t.String({ description: 'Driver email' }),
  licenseNumber: t.String({ description: 'License plate number' }),
  vehicleType: t.Optional(t.String({ description: 'Vehicle type' })),
  isActive: t.Boolean({ description: 'Is driver currently active' }),
  isAvailable: t.Boolean({ description: 'Is driver available for assignments' }),
  averageRating: t.Optional(t.Number({ minimum: 0, maximum: 5, description: 'Average rating' })),
  totalDeliveries: t.Number({ minimum: 0, description: 'Total completed deliveries' }),
  successRate: t.Optional(t.Number({ minimum: 0, maximum: 100, description: 'Success rate %' })),
  createdAt: t.Date({ description: 'Creation timestamp' }),
  updatedAt: t.Optional(t.Date({ description: 'Last update timestamp' })),
});

/**
 * TypeScript interface for driver responses
 */
export type DriverResponse = Static<typeof DriverResponseSchema>;

/**
 * Schema for updating driver status
 */
export const UpdateDriverSchema = t.Object({
  isActive: t.Optional(t.Boolean()),
  isAvailable: t.Optional(t.Boolean()),
  vehicleType: t.Optional(t.String()),
});

/**
 * TypeScript interface for driver updates
 */
export type UpdateDriver = Static<typeof UpdateDriverSchema>;

// ════════════════════════════════════════════════════════════════════════════
// DELIVERY ASSIGNMENT SCHEMAS & TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Schema for assigning a driver to an order
 */
export const AssignOrderSchema = t.Object({
  orderId: t.String({ minLength: 1, description: 'Order ID' }),
  driverId: t.String({ minLength: 1, description: 'Driver ID' }),
  assignmentType: t.Enum(
    {
      PICKUP: 'PICKUP',
      DELIVERY: 'DELIVERY',
      BOTH: 'BOTH',
    },
    { description: 'Type of assignment' }
  ),
  priority: t.Optional(
    t.Number({ minimum: 1, maximum: 5, description: 'Assignment priority (1=low, 5=high)' })
  ),
  notes: t.Optional(t.String({ description: 'Assignment notes' })),
});

/**
 * TypeScript interface for assignment requests
 */
export type AssignOrder = Static<typeof AssignOrderSchema>;

/**
 * Schema for delivery assignment response
 */
export const DeliveryAssignmentSchema = t.Object({
  id: t.String({ description: 'Assignment ID' }),
  orderId: t.String({ description: 'Order ID' }),
  driverId: t.String({ description: 'Driver ID' }),
  assignmentType: t.String({ description: 'PICKUP | DELIVERY | BOTH' }),
  status: t.Enum(
    {
      ASSIGNED: 'ASSIGNED',
      PICKED_UP: 'PICKED_UP',
      DELIVERED: 'DELIVERED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
    },
    { description: 'Delivery status' }
  ),
  priority: t.Number({ description: 'Assignment priority' }),
  estimatedPickupTime: t.Optional(t.Date({ description: 'Estimated pickup time' })),
  estimatedDeliveryTime: t.Optional(t.Date({ description: 'Estimated delivery time' })),
  actualPickupTime: t.Optional(t.Date({ description: 'Actual pickup time' })),
  actualDeliveryTime: t.Optional(t.Date({ description: 'Actual delivery time' })),
  createdAt: t.Date({ description: 'Creation timestamp' }),
  updatedAt: t.Optional(t.Date({ description: 'Last update timestamp' })),
});

/**
 * TypeScript interface for delivery assignments
 */
export type DeliveryAssignment = Static<typeof DeliveryAssignmentSchema>;

/**
 * Schema for updating delivery status
 */
export const UpdateDeliveryStatusSchema = t.Object({
  status: t.Enum(
    {
      PICKED_UP: 'PICKED_UP',
      DELIVERED: 'DELIVERED',
      FAILED: 'FAILED',
    },
    { description: 'New delivery status' }
  ),
  latitude: t.Optional(t.Number({ description: 'GPS latitude' })),
  longitude: t.Optional(t.Number({ description: 'GPS longitude' })),
  notes: t.Optional(t.String({ description: 'Status update notes' })),
  photoUrl: t.Optional(t.String({ description: 'Photo evidence URL' })),
  signature: t.Optional(t.String({ description: 'Digital signature' })),
});

/**
 * TypeScript interface for delivery status updates
 */
export type UpdateDeliveryStatus = Static<typeof UpdateDeliveryStatusSchema>;

/**
 * Schema for paginated delivery list
 */
export const DeliveryListSchema = t.Object({
  assignments: t.Array(DeliveryAssignmentSchema),
  pagination: t.Object({
    page: t.Number({ minimum: 1 }),
    limit: t.Number({ minimum: 1, maximum: 100 }),
    total: t.Number({ minimum: 0 }),
    pages: t.Number({ minimum: 1 }),
  }),
});

/**
 * TypeScript interface for paginated deliveries
 */
export type DeliveryList = Static<typeof DeliveryListSchema>;

// ════════════════════════════════════════════════════════════════════════════
// LEGACY CLASS EXPORTS (For backward compatibility if needed)
// Prefer using the schemas and interfaces above for new code
// ════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use CreateDriverSchema and CreateDriver type instead
 */
export class CreateDriverDTO implements CreateDriver {
  name!: string;
  phone!: string;
  email!: string;
  licenseNumber!: string;
  vehicleType?: string;

  constructor(data: CreateDriver) {
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.licenseNumber = data.licenseNumber;
    this.vehicleType = data.vehicleType;
  }
}

/**
 * @deprecated Use DriverResponseSchema and DriverResponse type instead
 */
export class DriverResponseDTO implements DriverResponse {
  id!: string;
  userId!: string;
  name!: string;
  phone!: string;
  email!: string;
  licenseNumber!: string;
  vehicleType?: string;
  isActive!: boolean;
  isAvailable!: boolean;
  averageRating?: number;
  totalDeliveries!: number;
  successRate?: number;
  createdAt!: Date;
  updatedAt?: Date;

  constructor(data: DriverResponse) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.licenseNumber = data.licenseNumber;
    this.vehicleType = data.vehicleType;
    this.isActive = data.isActive;
    this.isAvailable = data.isAvailable;
    this.averageRating = data.averageRating;
    this.totalDeliveries = data.totalDeliveries;
    this.successRate = data.successRate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * @deprecated Use AssignOrderSchema and AssignOrder type instead
 */
export class AssignOrderDTO implements AssignOrder {
  orderId!: string;
  driverId!: string;
  assignmentType!: 'PICKUP' | 'DELIVERY' | 'BOTH';
  priority?: number;
  notes?: string;

  constructor(data: AssignOrder) {
    this.orderId = data.orderId;
    this.driverId = data.driverId;
    this.assignmentType = data.assignmentType;
    this.priority = data.priority;
    this.notes = data.notes;
  }
}
