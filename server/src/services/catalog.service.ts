import { getPrismaClient } from '../config/database.js';
import type { ServiceCategory, Service } from '@sevasetu/shared';

export class CatalogService {
  private static get prisma() {
    const client = getPrismaClient();
    if (!client) throw new Error('Database client not initialized');
    return client;
  }

  /**
   * Returns all active service categories with their active service count.
   */
  static async getCategories(): Promise<ServiceCategory[]> {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { services: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      iconName: c.iconName,
      isActive: c.isActive,
      serviceCount: c._count.services,
    }));
  }

  /**
   * Returns a single category by its slug or ID.
   */
  static async getCategoryBySlugOrId(identifier: string): Promise<ServiceCategory | null> {
    const category = await this.prisma.serviceCategory.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
        isActive: true,
      },
      include: {
        _count: {
          select: { services: { where: { isActive: true } } },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconName: category.iconName,
      isActive: category.isActive,
      serviceCount: category._count.services,
    };
  }

  /**
   * Returns active catalog services, with optional category filtering.
   */
  static async getServices(filter?: {
    categoryId?: string;
    categorySlug?: string;
  }): Promise<Service[]> {
    const whereClause: {
      isActive: boolean;
      categoryId?: string;
      category?: { slug: string; isActive: boolean };
    } = { isActive: true };

    if (filter?.categoryId) {
      whereClause.categoryId = filter.categoryId;
    } else if (filter?.categorySlug) {
      whereClause.category = { slug: filter.categorySlug, isActive: true };
    }

    const services = await this.prisma.service.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { title: 'asc' }],
    });

    return services.map((s) => ({
      id: s.id,
      categoryId: s.categoryId,
      categoryName: s.category.name,
      title: s.title,
      slug: s.slug,
      description: s.description,
      serviceType: s.serviceType,
      pricingModel: s.pricingModel,
      basePrice: s.basePrice,
      currency: 'INR',
      durationMinutes: s.durationMinutes,
      includedFeatures: s.includedFeatures,
      isActive: s.isActive,
    }));
  }

  /**
   * Returns a specific service by ID or slug.
   */
  static async getServiceById(identifier: string): Promise<Service | null> {
    const service = await this.prisma.service.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    if (!service) return null;

    return {
      id: service.id,
      categoryId: service.categoryId,
      categoryName: service.category.name,
      title: service.title,
      slug: service.slug,
      description: service.description,
      serviceType: service.serviceType,
      pricingModel: service.pricingModel,
      basePrice: service.basePrice,
      currency: 'INR',
      durationMinutes: service.durationMinutes,
      includedFeatures: service.includedFeatures,
      isActive: service.isActive,
    };
  }

  /**
   * Returns services specifically under a category ID or slug.
   */
  static async getServicesByCategory(categoryIdOrSlug: string): Promise<Service[]> {
    return this.getServices({
      categorySlug: categoryIdOrSlug.includes('-') ? categoryIdOrSlug : undefined,
      categoryId: !categoryIdOrSlug.includes('-') ? categoryIdOrSlug : undefined,
    });
  }
}
