import { db, customers, users } from '../../../db';
import { eq, and, desc, like } from 'drizzle-orm';

/**
 * Customers Controller
 * Handles customer management
 */
export class CustomersController {
  constructor() {}

  /**
   * Create a new customer
   * POST /customers
   */
  async createCustomer(body: any, context: any) {
    try {
      const {
        name,
        email,
        phone,
        customerType,
        address,
        city,
        postalCode,
        latitude,
        longitude,
        companyName,
        taxId,
        notes,
      } = body;

      const user = context.user;
      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if email already exists
      if (email) {
        const [existing] = await db
          .select()
          .from(customers)
          .where(eq(customers.email, email))
          .limit(1);

        if (existing) {
          context.set.status = 400;
          return { success: false, message: 'Email already registered', data: null };
        }
      }

      const [newCustomer] = await db.insert(customers).values({
        name,
        email,
        phone,
        customerType: customerType || 'INDIVIDUAL',
        address,
        city,
        postalCode,
        latitude: latitude?.toString() || null,
        longitude: longitude?.toString() || null,
        companyName,
        taxId,
        notes,
        isActive: true,
        loyaltyPoints: 0,
        membershipLevel: 'STANDARD',
      }).returning();

      context.set.status = 201;
      return {
        success: true,
        message: 'Customer created successfully',
        data: newCustomer,
      };
    } catch (error) {
      console.error('[CustomersController] Create error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create customer',
        data: null,
      };
    }
  }

  /**
   * Get customer by ID
   * GET /customers/:id
   */
  async getCustomer(params: any, context: any) {
    try {
      const { id } = params;

      const [customer] = await db
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          customerType: customers.customerType,
          address: customers.address,
          city: customers.city,
          postalCode: customers.postalCode,
          latitude: customers.latitude,
          longitude: customers.longitude,
          companyName: customers.companyName,
          taxId: customers.taxId,
          loyaltyPoints: customers.loyaltyPoints,
          membershipLevel: customers.membershipLevel,
          isActive: customers.isActive,
          isVerified: customers.isVerified,
          notes: customers.notes,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!customer) {
        context.set.status = 404;
        return { success: false, message: 'Customer not found', data: null };
      }

      return {
        success: true,
        message: 'Customer retrieved successfully',
        data: customer,
      };
    } catch (error) {
      console.error('[CustomersController] Get error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get customer',
        data: null,
      };
    }
  }

  /**
   * List all customers with filtering
   * GET /customers
   */
  async listCustomers(query: any, context: any) {
    try {
      const { customerType, search, isActive, limit = 50, page = 1 } = query;
      const offset = (page - 1) * limit;

      // Build conditions
      const conditions: any[] = [];
      if (customerType) conditions.push(eq(customers.customerType, customerType));
      if (isActive !== undefined) conditions.push(eq(customers.isActive, isActive === 'true'));
      if (search) {
        conditions.push(
          like(customers.name, `%${search}%`)
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const customerList = await db
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          customerType: customers.customerType,
          address: customers.address,
          city: customers.city,
          membershipLevel: customers.membershipLevel,
          loyaltyPoints: customers.loyaltyPoints,
          isActive: customers.isActive,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .where(whereClause)
        .orderBy(desc(customers.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      return {
        success: true,
        message: 'Customers retrieved successfully',
        data: {
          customers: customerList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
          },
        },
      };
    } catch (error) {
      console.error('[CustomersController] List error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list customers',
        data: null,
      };
    }
  }

  /**
   * Update customer
   * PATCH /customers/:id
   */
  async updateCustomer(params: any, body: any, context: any) {
    try {
      const { id } = params;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if customer exists
      const [existing] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!existing) {
        context.set.status = 404;
        return { success: false, message: 'Customer not found', data: null };
      }

      // Build update object
      const updateData: any = { updatedAt: new Date() };

      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.customerType !== undefined) updateData.customerType = body.customerType;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
      if (body.latitude !== undefined) updateData.latitude = body.latitude?.toString();
      if (body.longitude !== undefined) updateData.longitude = body.longitude?.toString();
      if (body.companyName !== undefined) updateData.companyName = body.companyName;
      if (body.taxId !== undefined) updateData.taxId = body.taxId;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.membershipLevel !== undefined) updateData.membershipLevel = body.membershipLevel;

      const [updated] = await db
        .update(customers)
        .set(updateData)
        .where(eq(customers.id, id))
        .returning();

      return {
        success: true,
        message: 'Customer updated successfully',
        data: updated,
      };
    } catch (error) {
      console.error('[CustomersController] Update error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update customer',
        data: null,
      };
    }
  }

  /**
   * Delete (deactivate) customer
   * DELETE /customers/:id
   */
  async deleteCustomer(params: any, context: any) {
    try {
      const { id } = params;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      const [existing] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!existing) {
        context.set.status = 404;
        return { success: false, message: 'Customer not found', data: null };
      }

      // Soft delete by deactivating
      await db
        .update(customers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(customers.id, id));

      return {
        success: true,
        message: 'Customer deactivated successfully',
        data: null,
      };
    } catch (error) {
      console.error('[CustomersController] Delete error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete customer',
        data: null,
      };
    }
  }

  /**
   * Get customer orders
   * GET /customers/:id/orders
   */
  async getCustomerOrders(params: any, query: any, context: any) {
    try {
      const { id } = params;
      const { limit = 10, page = 1 } = query;

      const user = context.user;
      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if customer exists
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!customer) {
        context.set.status = 404;
        return { success: false, message: 'Customer not found', data: null };
      }

      // Import orders here to avoid circular dependency
      const { orders } = await import('../../../db/schema/orders');

      const offset = (page - 1) * limit;
      const orderList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.customerId, id))
        .orderBy(desc(orders.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      return {
        success: true,
        message: 'Customer orders retrieved',
        data: {
          orders: orderList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
          },
        },
      };
    } catch (error) {
      console.error('[CustomersController] Get orders error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get customer orders',
        data: null,
      };
    }
  }

  /**
   * Add loyalty points
   * POST /customers/:id/loyalty
   */
  async addLoyaltyPoints(params: any, body: any, context: any) {
    try {
      const { id } = params;
      const { points } = body;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!customer) {
        context.set.status = 404;
        return { success: false, message: 'Customer not found', data: null };
      }

      const newPoints = (customer.loyaltyPoints || 0) + points;
      const [updated] = await db
        .update(customers)
        .set({
          loyaltyPoints: newPoints,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning();

      return {
        success: true,
        message: 'Loyalty points added',
        data: {
          customerId: id,
          pointsAdded: points,
          totalPoints: newPoints,
        },
      };
    } catch (error) {
      console.error('[CustomersController] Add loyalty error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add loyalty points',
        data: null,
      };
    }
  }
}
