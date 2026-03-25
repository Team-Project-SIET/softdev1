import { db, services, servicePricingRules } from '../../../db';
import { eq, and, desc, like } from 'drizzle-orm';

/**
 * Services Controller
 * Handles service catalog management
 */
export class ServicesController {
  constructor() {}

  /**
   * Create a new service
   * POST /services
   */
  async createService(body: any, context: any) {
    try {
      const {
        name,
        description,
        category,
        basePrice,
        pricePerKg,
        pricePerItem,
        applicableItemTypes,
        estimatedDays,
        isRushAvailable,
        rushPrice,
        icon,
        color,
        displayOrder,
      } = body;

      const user = context.user;
      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      const [newService] = await db.insert(services).values({
        name,
        description,
        category,
        basePrice: basePrice.toString(),
        pricePerKg: pricePerKg?.toString() || null,
        pricePerItem: pricePerItem?.toString() || null,
        applicableItemTypes,
        estimatedDays: estimatedDays || 3,
        isRushAvailable: isRushAvailable || false,
        rushPrice: rushPrice?.toString() || null,
        icon,
        color,
        displayOrder: displayOrder || 0,
        isActive: true,
      }).returning();

      context.set.status = 201;
      return {
        success: true,
        message: 'Service created successfully',
        data: newService,
      };
    } catch (error) {
      console.error('[ServicesController] Create error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create service',
        data: null,
      };
    }
  }

  /**
   * Get service by ID
   * GET /services/:id
   */
  async getService(params: any, context: any) {
    try {
      const { id } = params;

      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!service) {
        context.set.status = 404;
        return { success: false, message: 'Service not found', data: null };
      }

      // Get pricing rules for this service
      const pricingRules = await db
        .select()
        .from(servicePricingRules)
        .where(eq(servicePricingRules.serviceId, id));

      return {
        success: true,
        message: 'Service retrieved successfully',
        data: {
          ...service,
          pricingRules,
        },
      };
    } catch (error) {
      console.error('[ServicesController] Get error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get service',
        data: null,
      };
    }
  }

  /**
   * List all services with filtering
   * GET /services
   */
  async listServices(query: any, context: any) {
    try {
      const { category, isActive, search, limit = 50, page = 1 } = query;
      const offset = (page - 1) * limit;

      // Build conditions
      const conditions: any[] = [];
      if (category) conditions.push(eq(services.category, category));
      if (isActive !== undefined) conditions.push(eq(services.isActive, isActive === 'true'));
      if (search) conditions.push(like(services.name, `%${search}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const serviceList = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          category: services.category,
          basePrice: services.basePrice,
          pricePerKg: services.pricePerKg,
          pricePerItem: services.pricePerItem,
          estimatedDays: services.estimatedDays,
          isRushAvailable: services.isRushAvailable,
          rushPrice: services.rushPrice,
          icon: services.icon,
          color: services.color,
          isActive: services.isActive,
          displayOrder: services.displayOrder,
          createdAt: services.createdAt,
        })
        .from(services)
        .where(whereClause)
        .orderBy(services.displayOrder, services.name)
        .limit(parseInt(limit))
        .offset(offset);

      return {
        success: true,
        message: 'Services retrieved successfully',
        data: {
          services: serviceList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
          },
        },
      };
    } catch (error) {
      console.error('[ServicesController] List error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list services',
        data: null,
      };
    }
  }

  /**
   * Update a service
   * PATCH /services/:id
   */
  async updateService(params: any, body: any, context: any) {
    try {
      const { id } = params;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if service exists
      const [existingService] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!existingService) {
        context.set.status = 404;
        return { success: false, message: 'Service not found', data: null };
      }

      // Build update object (only update provided fields)
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.basePrice !== undefined) updateData.basePrice = body.basePrice.toString();
      if (body.pricePerKg !== undefined) updateData.pricePerKg = body.pricePerKg?.toString();
      if (body.pricePerItem !== undefined) updateData.pricePerItem = body.pricePerItem?.toString();
      if (body.applicableItemTypes !== undefined) updateData.applicableItemTypes = body.applicableItemTypes;
      if (body.estimatedDays !== undefined) updateData.estimatedDays = body.estimatedDays;
      if (body.isRushAvailable !== undefined) updateData.isRushAvailable = body.isRushAvailable;
      if (body.rushPrice !== undefined) updateData.rushPrice = body.rushPrice?.toString();
      if (body.icon !== undefined) updateData.icon = body.icon;
      if (body.color !== undefined) updateData.color = body.color;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;

      const [updatedService] = await db
        .update(services)
        .set(updateData)
        .where(eq(services.id, id))
        .returning();

      return {
        success: true,
        message: 'Service updated successfully',
        data: updatedService,
      };
    } catch (error) {
      console.error('[ServicesController] Update error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update service',
        data: null,
      };
    }
  }

  /**
   * Delete (deactivate) a service
   * DELETE /services/:id
   */
  async deleteService(params: any, context: any) {
    try {
      const { id } = params;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Soft delete by deactivating
      const [updatedService] = await db
        .update(services)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(services.id, id))
        .returning();

      if (!updatedService) {
        context.set.status = 404;
        return { success: false, message: 'Service not found', data: null };
      }

      return {
        success: true,
        message: 'Service deactivated successfully',
        data: null,
      };
    } catch (error) {
      console.error('[ServicesController] Delete error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service',
        data: null,
      };
    }
  }

  /**
   * Create pricing rule for a service
   * POST /services/:id/pricing-rules
   */
  async createPricingRule(params: any, body: any, context: any) {
    try {
      const { id } = params;
      const user = context.user;

      if (!user) {
        context.set.status = 401;
        return { success: false, message: 'Unauthorized', data: null };
      }

      // Check if service exists
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!service) {
        context.set.status = 404;
        return { success: false, message: 'Service not found', data: null };
      }

      const [newRule] = await db.insert(servicePricingRules).values({
        serviceId: id,
        ruleType: body.ruleType,
        minQuantity: body.minQuantity,
        maxQuantity: body.maxQuantity,
        applicableMembership: body.applicableMembership,
        discountType: body.discountType,
        discountValue: body.discountValue.toString(),
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        isActive: true,
      }).returning();

      context.set.status = 201;
      return {
        success: true,
        message: 'Pricing rule created successfully',
        data: newRule,
      };
    } catch (error) {
      console.error('[ServicesController] Create pricing rule error:', error);
      context.set.status = 500;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create pricing rule',
        data: null,
      };
    }
  }
}
