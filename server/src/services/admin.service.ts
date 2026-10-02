import { getPrismaClient } from '../config/database.js';
import {
  Prisma,
  Role,
  AccountStatus,
  PricingModel,
  VerificationStatus,
  DisputePriority,
  DisputeStatus,
  SupportTicketPriority,
  SupportTicketStatus,
  TrustSafetySeverity,
  TrustSafetyStatus,
} from '@prisma/client';

export type UserRole = Role;
export type UserStatus = AccountStatus;
import type {
  AdminDashboardMetrics,
  PlatformSettingRecord,
  VerificationRecord,
  SubmitVerificationInput,
  ReviewVerificationInput,
  DisputeRecord,
  CreateDisputeInput,
  TransitionDisputeInput,
  SupportTicketRecord,
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
  TrustSafetyCaseRecord,
  CreateTrustSafetyCaseInput,
  UpdateTrustSafetyCaseInput,
  ReportRecord,
  ReportStatus,
  BookingStatus,
} from '@sevasetu/shared';
import { AuditService } from './audit.service.js';
import { FinancialPolicyService } from './financial-policy.service.js';
import { BookingTransitionService } from './booking-transition.service.js';
import { PaymentService } from './payment.service.js';

export class AdminServiceError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AdminServiceError';
    this.statusCode = statusCode;
  }
}

export class AdminService {
  // ==========================================
  // 1. DASHBOARD METRICS
  // ==========================================
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProviders,
      activeProviders,
      verifiedProviders,
      restrictedProviders,
      totalBookings,
      completedBookings,
      activeBookings,
      paidPaymentsAggregate,
      pendingVerifications,
      openDisputes,
      openReports,
      openSupportTickets,
      trustSafetyFlagged,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.serviceProviderProfile.count(),
      prisma.serviceProviderProfile.count({
        where: { user: { status: 'ACTIVE' }, isRestricted: false },
      }),
      prisma.serviceProviderProfile.count({ where: { isVerified: true } }),
      prisma.serviceProviderProfile.count({ where: { isRestricted: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({
        where: {
          status: {
            in: ['PENDING_PROVIDER', 'ACCEPTED', 'SCHEDULED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'],
          },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true, platformFee: true },
        where: { status: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
      }),
      prisma.verificationRecord.count({ where: { status: 'SUBMITTED' } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'WAITING_FOR_INFO'] } } }),
      prisma.report.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER'] } } }),
      prisma.trustSafetyCase.count({ where: { status: { in: ['FLAGGED', 'UNDER_REVIEW'] } } }),
    ]);

    const totalRevenuePaise = paidPaymentsAggregate._sum.amount || 0;
    const platformCommissionPaise = paidPaymentsAggregate._sum.platformFee || 0;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProviders,
      activeProviders,
      verifiedProviders,
      restrictedProviders,
      totalBookings,
      completedBookings,
      activeBookings,
      totalRevenuePaise,
      platformCommissionPaise,
      pendingVerifications,
      openDisputes,
      openReports,
      openSupportTickets,
      trustSafetyFlagged,
    };
  }

  // ==========================================
  // 2. USER MANAGEMENT
  // ==========================================
  static async listUsers(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          providerProfile: {
            select: {
              id: true,
              businessName: true,
              isRestricted: true,
              isVerified: true,
              onboardingStatus: true,
            },
          },
          _count: {
            select: {
              customerBookings: true,
              reviews: true,
              reportsMade: true,
              disputesOpened: true,
            },
          },
        },
      }),
    ]);

    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      providerProfile: u.providerProfile,
      activitySummary: {
        bookingsCount: u._count.customerBookings,
        reviewsCount: u._count.reviews,
        reportsCount: u._count.reportsMade,
        disputesCount: u._count.disputesOpened,
      },
    }));

    return {
      users: sanitizedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUserDetail(userId: string) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        providerProfile: {
          include: {
            skills: true,
            services: { include: { service: true } },
            serviceAreas: true,
            verificationRecords: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        _count: {
          select: {
            customerBookings: true,
            reviews: true,
            reportsMade: true,
            reportsReceived: true,
            disputesOpened: true,
            supportTickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new AdminServiceError('User not found.', 404);
    }

    return {
      ...user,
      activity: {
        bookingsCount: user._count.customerBookings,
        reviewsCount: user._count.reviews,
        reportsCount: user._count.reportsMade,
        reportsReceivedCount: user._count.reportsReceived,
        disputesCount: user._count.disputesOpened,
        supportTicketsCount: user._count.supportTickets,
      },
    };
  }

  static async updateUserStatus(
    adminUserId: string,
    targetUserId: string,
    status: UserStatus,
    reason?: string,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new AdminServiceError('Target user not found.', 404);
    }

    if (targetUser.role === 'ADMIN' && status !== 'ACTIVE') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      });
      if (activeAdminCount <= 1) {
        throw new AdminServiceError('Cannot suspend or deactivate the last operational administrator.', 400);
      }
    }

    const previousStatus = targetUser.status;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { status },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'USER_STATUS_UPDATE',
          entityType: 'User',
          entityId: targetUserId,
          reason: reason || `Updated status from ${previousStatus} to ${status}`,
          metadata: { previousStatus, newStatus: status },
          ipAddress,
        },
        tx
      );

      return u;
    });

    return updatedUser;
  }

  static async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole,
    reason?: string,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new AdminServiceError('Target user not found.', 404);
    }

    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      });
      if (activeAdminCount <= 1) {
        throw new AdminServiceError('Cannot demote the last operational administrator.', 400);
      }
    }

    const previousRole = targetUser.role;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'USER_ROLE_UPDATE',
          entityType: 'User',
          entityId: targetUserId,
          reason: reason || `Changed role from ${previousRole} to ${newRole}`,
          metadata: { previousRole, newRole },
          ipAddress,
        },
        tx
      );

      return u;
    });

    return updated;
  }

  // ==========================================
  // 3. PROVIDER OPERATIONS
  // ==========================================
  static async listProviders(params: {
    page?: number;
    limit?: number;
    isRestricted?: boolean;
    isVerified?: boolean;
    search?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceProviderProfileWhereInput = {};
    if (params.isRestricted !== undefined) where.isRestricted = params.isRestricted;
    if (params.isVerified !== undefined) where.isVerified = params.isVerified;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, providers] = await Promise.all([
      prisma.serviceProviderProfile.count({ where }),
      prisma.serviceProviderProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
            },
          },
          _count: {
            select: {
              services: true,
              skills: true,
              serviceAreas: true,
              bookings: true,
              verificationRecords: true,
            },
          },
        },
      }),
    ]);

    return {
      providers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getProviderDetail(providerProfileId: string) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerProfileId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        skills: true,
        services: { include: { service: true } },
        serviceAreas: true,
        verificationRecords: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!provider) {
      throw new AdminServiceError('Provider profile not found.', 404);
    }

    return provider;
  }

  static async restrictProvider(
    adminUserId: string,
    providerProfileId: string,
    isRestricted: boolean,
    reason: string,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (isRestricted && (!reason || !reason.trim())) {
      throw new AdminServiceError('A reason is required to restrict a service provider.', 400);
    }

    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerProfileId },
      include: { user: true },
    });

    if (!provider) {
      throw new AdminServiceError('Provider profile not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.serviceProviderProfile.update({
        where: { id: providerProfileId },
        data: {
          isRestricted,
          restrictionReason: isRestricted ? reason.trim() : null,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: isRestricted ? 'PROVIDER_RESTRICT' : 'PROVIDER_UNRESTRICT',
          entityType: 'ServiceProviderProfile',
          entityId: providerProfileId,
          reason: reason || (isRestricted ? 'Restricted provider' : 'Unrestricted provider'),
          metadata: { providerUserId: provider.userId, isRestricted },
          ipAddress,
        },
        tx
      );

      return p;
    });

    return updated;
  }

  // ==========================================
  // 4. SERVICE CATALOG ADMINISTRATION
  // ==========================================
  static async listCatalogCategories() {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    return prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
  }

  static async createCategory(
    adminUserId: string,
    data: { name: string; slug: string; description?: string; icon?: string },
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const name = data.name?.trim();
    const slug = (data.slug?.trim() || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || '';

    if (!name || !slug) {
      throw new AdminServiceError('Category name is required.', 400);
    }

    const existing = await prisma.serviceCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new AdminServiceError(`Category with slug '${slug}' already exists.`, 400);
    }

    const category = await prisma.$transaction(async (tx) => {
      const c = await tx.serviceCategory.create({
        data: {
          name,
          slug,
          description: data.description?.trim() || name,
          iconName: data.icon?.trim() || null,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'CATALOG_CATEGORY_CREATE',
          entityType: 'ServiceCategory',
          entityId: c.id,
          reason: `Created category ${c.name}`,
          metadata: { name: c.name, slug: c.slug },
          ipAddress,
        },
        tx
      );

      return c;
    });

    return category;
  }

  static async listCatalogServices(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: {
          category: true,
          _count: {
            select: { providerServices: true },
          },
        },
      }),
    ]);

    return {
      services,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createService(
    adminUserId: string,
    data: {
      categoryId: string;
      title?: string;
      name?: string;
      slug?: string;
      description?: string;
      pricingModel?: PricingModel;
      priceModel?: PricingModel;
      basePrice?: number;
      basePricePaise?: number;
      icon?: string;
    },
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const anyData = data as any;
    const serviceTitle = (data.title || data.name)?.trim();
    const slug = (data.slug?.trim() || serviceTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || '';
    const basePrice = data.basePrice !== undefined ? data.basePrice : (anyData.basePricePaise !== undefined ? anyData.basePricePaise / 100 : 0);

    if (!serviceTitle || !slug || !data.categoryId) {
      throw new AdminServiceError('Service title, slug, and categoryId are required.', 400);
    }
    if (basePrice < 0) {
      throw new AdminServiceError('Base price cannot be negative.', 400);
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new AdminServiceError('Category not found.', 404);
    }

    const existing = await prisma.service.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new AdminServiceError(`Service with slug '${slug}' already exists.`, 400);
    }

    const pricingModel = data.pricingModel || data.priceModel || 'FIXED';

    const service = await prisma.$transaction(async (tx) => {
      const s = await tx.service.create({
        data: {
          categoryId: data.categoryId,
          title: serviceTitle,
          slug,
          description: data.description?.trim() || '',
          pricingModel,
          basePrice,
          isActive: true,
        },
        include: { category: true },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'CATALOG_SERVICE_CREATE',
          entityType: 'Service',
          entityId: s.id,
          reason: `Created service ${s.title}`,
          metadata: { title: s.title, slug: s.slug, basePrice: s.basePrice },
          ipAddress,
        },
        tx
      );

      return s;
    });

    return service;
  }

  static async updateService(
    adminUserId: string,
    serviceId: string,
    data: Partial<{
      title: string;
      name: string;
      description: string;
      pricingModel: PricingModel;
      priceModel: PricingModel;
      basePrice: number;
      isActive: boolean;
    }>,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      throw new AdminServiceError('Service not found.', 404);
    }

    const serviceTitle = (data.title || data.name)?.trim();
    const pricingModel = data.pricingModel || data.priceModel;

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.service.update({
        where: { id: serviceId },
        data: {
          title: serviceTitle,
          description: data.description?.trim(),
          pricingModel,
          basePrice: data.basePrice !== undefined ? data.basePrice : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
        include: { category: true },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'CATALOG_SERVICE_UPDATE',
          entityType: 'Service',
          entityId: serviceId,
          reason: `Updated service ${s.title}`,
          metadata: data,
          ipAddress,
        },
        tx
      );

      return s;
    });

    return updated;
  }

  static async setServiceActiveStatus(
    adminUserId: string,
    serviceId: string,
    isActive: boolean,
    reason?: string,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new AdminServiceError('Service not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.service.update({
        where: { id: serviceId },
        data: { isActive },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: isActive ? 'CATALOG_SERVICE_ACTIVATE' : 'CATALOG_SERVICE_DEACTIVATE',
          entityType: 'Service',
          entityId: serviceId,
          reason: reason || (isActive ? 'Activated service' : 'Deactivated service'),
          metadata: { serviceTitle: service.title, isActive },
          ipAddress,
        },
        tx
      );

      return s;
    });

    return updated;
  }

  // ==========================================
  // 5. BOOKING OPERATIONS
  // ==========================================
  static async listBookings(params: {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) where.createdAt.lte = new Date(params.toDate);
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { customer: { fullName: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { providerProfile: { businessName: { contains: q, mode: 'insensitive' } } },
        { serviceTitleSnapshot: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          providerProfile: {
            select: { id: true, businessName: true, user: { select: { fullName: true, email: true } } },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, amount: true, currency: true },
          },
          _count: {
            select: {
              disputes: true,
              reports: true,
            },
          },
        },
      }),
    ]);

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getBookingDetail(bookingId: string) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        providerProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          include: {
            refunds: true,
            invoices: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        disputes: {
          orderBy: { createdAt: 'desc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new AdminServiceError('Booking not found.', 404);
    }

    return booking;
  }

  static async operationalCancelBooking(
    adminUserId: string,
    bookingId: string,
    reason: string,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!reason || !reason.trim()) {
      throw new AdminServiceError('A reason is required for operational booking cancellation.', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new AdminServiceError('Booking not found.', 404);
    }

    BookingTransitionService.validateTransition(booking.status, 'CANCELLED', 'SYSTEM');

    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: `[ADMIN OPERATIONAL CANCEL] ${reason.trim()}`,
          cancelledBy: 'SYSTEM',
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: booking.status,
          newStatus: 'CANCELLED',
          actorType: 'SYSTEM',
          actorUserId: adminUserId,
          reason: `Admin operational cancellation: ${reason.trim()}`,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'BOOKING_OPERATIONAL_CANCEL',
          entityType: 'Booking',
          entityId: bookingId,
          reason: reason.trim(),
          metadata: { previousStatus: booking.status, bookingId },
          ipAddress,
        },
        tx
      );

      return updated;
    });

    // If booking was paid, process cancellation refund
    try {
      await PaymentService.processCancellationRefund(
        bookingId,
        adminUserId,
        'SYSTEM',
        `Admin operational cancellation: ${reason.trim()}`
      );
    } catch {
      // If refund is not applicable, continue
    }

    return cancelled;
  }

  // ==========================================
  // 6. PAYMENTS & REFUNDS OPERATIONS
  // ==========================================
  static async listPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { referenceCode: { contains: q, mode: 'insensitive' } },
        { customer: { fullName: { contains: q, mode: 'insensitive' } } },
        { bookingId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          providerProfile: { select: { id: true, businessName: true, user: { select: { fullName: true, email: true } } } },
          refunds: true,
          invoices: { select: { id: true, invoiceNumber: true, paymentStatus: true } },
        },
      }),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async listRefunds(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { refundReference: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, refunds] = await Promise.all([
      prisma.refund.count({ where }),
      prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              id: true,
              referenceCode: true,
              amount: true,
              currency: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      refunds,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async processManualRefund(
    adminUserId: string,
    paymentId: string,
    amountPaise: number,
    reason: string,
    ipAddress?: string
  ) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!amountPaise || amountPaise <= 0) {
      throw new AdminServiceError('Refund amount must be a positive integer in paise.', 400);
    }
    if (!reason || !reason.trim()) {
      throw new AdminServiceError('A refund reason is required.', 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });
    if (!payment) {
      throw new AdminServiceError('Payment record not found.', 404);
    }

    if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new AdminServiceError(`Cannot refund payment in status '${payment.status}'.`, 400);
    }

    const totalRefundedSoFar = payment.refunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const remainingRefundable = payment.amount - totalRefundedSoFar;
    if (amountPaise > remainingRefundable) {
      throw new AdminServiceError(
        `Requested refund amount (${amountPaise / 100} INR) exceeds remaining refundable balance (${remainingRefundable / 100} INR).`,
        400
      );
    }

    const refund = await prisma.$transaction(async (tx) => {
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
      const refundReference = `RFND-MAN-${dateCode}-${randomHex}`;

      const r = await tx.refund.create({
        data: {
          refundReference,
          paymentId: payment.id,
          bookingId: payment.bookingId,
          gatewayRefundId: `man_rfnd_${Date.now()}`,
          amount: amountPaise,
          currency: payment.currency,
          status: 'COMPLETED',
          reason: `Admin refund: ${reason.trim()}`,
          initiatedBy: 'SYSTEM',
          initiatedByUserId: adminUserId,
          processedAt: new Date(),
        },
      });

      const newTotalRefunded = totalRefundedSoFar + amountPaise;
      const newStatus = newTotalRefunded === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'PAYMENT_MANUAL_REFUND',
          entityType: 'Payment',
          entityId: payment.id,
          reason: reason.trim(),
          metadata: { refundId: r.id, refundReference, amountPaise, previousStatus: payment.status, newStatus },
          ipAddress,
        },
        tx
      );

      return r;
    });

    return refund;
  }

  // ==========================================
  // 7. VERIFICATION OPERATIONS
  // ==========================================
  static async submitVerification(
    providerUserId: string,
    input: SubmitVerificationInput
  ): Promise<VerificationRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId: providerUserId },
    });
    if (!profile) {
      throw new AdminServiceError('Provider profile not found for this user.', 404);
    }

    if (!input.verificationType?.trim()) {
      throw new AdminServiceError('Verification type is required.', 400);
    }
    if (!input.documents || input.documents.length === 0) {
      throw new AdminServiceError('At least one document reference is required.', 400);
    }

    const created = await prisma.verificationRecord.create({
      data: {
        providerProfileId: profile.id,
        verificationType: input.verificationType.trim(),
        status: 'SUBMITTED',
        submittedAt: new Date(),
        documents: (input.documents as unknown) as Prisma.InputJsonValue,
        reviewerNotes: input.notes || null,
      },
    });

    return {
      id: created.id,
      providerProfileId: created.providerProfileId,
      verificationType: created.verificationType,
      status: created.status as any,
      submittedAt: created.submittedAt.toISOString(),
      reviewedAt: created.reviewedAt ? created.reviewedAt.toISOString() : undefined,
      reviewedByAdminId: created.reviewedByAdminId || undefined,
      rejectionReason: created.rejectionReason || undefined,
      documents: input.documents,
      reviewerNotes: created.reviewerNotes || undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  static async listVerifications(params: {
    page?: number;
    limit?: number;
    status?: string;
    verificationType?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.VerificationRecordWhereInput = {};
    if (params.status) where.status = params.status as VerificationStatus;
    if (params.verificationType) where.verificationType = params.verificationType;

    const [total, records] = await Promise.all([
      prisma.verificationRecord.count({ where }),
      prisma.verificationRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          providerProfile: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          reviewedByAdmin: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    const items: VerificationRecord[] = records.map((r) => ({
      id: r.id,
      providerProfileId: r.providerProfileId,
      providerName: r.providerProfile.businessName || r.providerProfile.user.fullName || 'Provider',
      emailMasked: r.providerProfile.user.email,
      phoneMasked: r.providerProfile.user.phone || undefined,
      verificationType: r.verificationType,
      status: r.status as any,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
      reviewedByAdminId: r.reviewedByAdminId || undefined,
      rejectionReason: r.rejectionReason || undefined,
      documents: (r.documents as any) || [],
      reviewerNotes: r.reviewerNotes || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return {
      verifications: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getVerificationDetail(id: string): Promise<VerificationRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const record = await prisma.verificationRecord.findUnique({
      where: { id },
      include: {
        providerProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
        reviewedByAdmin: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!record) {
      throw new AdminServiceError('Verification record not found.', 404);
    }

    return {
      id: record.id,
      providerProfileId: record.providerProfileId,
      providerName: record.providerProfile.businessName || record.providerProfile.user.fullName || 'Provider',
      emailMasked: record.providerProfile.user.email,
      phoneMasked: record.providerProfile.user.phone || undefined,
      verificationType: record.verificationType,
      status: record.status as any,
      submittedAt: record.submittedAt.toISOString(),
      reviewedAt: record.reviewedAt ? record.reviewedAt.toISOString() : undefined,
      reviewedByAdminId: record.reviewedByAdminId || undefined,
      rejectionReason: record.rejectionReason || undefined,
      documents: (record.documents as any) || [],
      reviewerNotes: record.reviewerNotes || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static async reviewVerification(
    adminUserId: string,
    id: string,
    input: ReviewVerificationInput,
    ipAddress?: string
  ): Promise<VerificationRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!['APPROVED', 'REJECTED', 'NEEDS_INFORMATION'].includes(input.status)) {
      throw new AdminServiceError(`Invalid review status '${input.status}'.`, 400);
    }

    if (input.status === 'REJECTED' && (!input.rejectionReason || !input.rejectionReason.trim())) {
      throw new AdminServiceError('A reason is required when rejecting a verification submission.', 400);
    }

    const record = await prisma.verificationRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new AdminServiceError('Verification record not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.verificationRecord.update({
        where: { id },
        data: {
          status: input.status as VerificationStatus,
          reviewedAt: new Date(),
          reviewedByAdminId: adminUserId,
          rejectionReason: input.rejectionReason?.trim() || null,
          reviewerNotes: input.notes?.trim() || record.reviewerNotes,
        },
      });

      // Update provider profile's isVerified flag
      if (input.status === 'APPROVED') {
        await tx.serviceProviderProfile.update({
          where: { id: record.providerProfileId },
          data: { isVerified: true },
        });
      } else if (input.status === 'REJECTED') {
        const otherApproved = await tx.verificationRecord.count({
          where: {
            providerProfileId: record.providerProfileId,
            status: 'APPROVED',
            id: { not: id },
          },
        });
        if (otherApproved === 0) {
          await tx.serviceProviderProfile.update({
            where: { id: record.providerProfileId },
            data: { isVerified: false },
          });
        }
      }

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: `VERIFICATION_${input.status}`,
          entityType: 'VerificationRecord',
          entityId: id,
          reason: input.rejectionReason || `Verification set to ${input.status}`,
          metadata: {
            providerProfileId: record.providerProfileId,
            verificationType: record.verificationType,
            status: input.status,
          },
          ipAddress,
        },
        tx
      );

      return updatedRecord;
    });

    return AdminService.getVerificationDetail(updated.id);
  }

  // ==========================================
  // 8. REPORTS OPERATIONS
  // ==========================================
  static async listReports(params: {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    priority?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.priority) where.priority = params.priority;

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporterUser: { select: { id: true, fullName: true, email: true, role: true } },
          reportedUser: { select: { id: true, fullName: true, email: true, role: true } },
          assignedAdmin: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    const items: ReportRecord[] = reports.map((r) => ({
      id: r.id,
      reporterUserId: r.reporterUserId,
      reporterName: r.reporterUser?.fullName || undefined,
      reportedUserId: r.reportedUserId,
      reportedUserName: r.reportedUser?.fullName || undefined,
      bookingId: r.bookingId,
      messageId: r.messageId,
      reviewId: r.reviewId,
      reason: r.reason,
      details: r.details,
      status: r.status as ReportStatus,
      priority: r.priority || undefined,
      assignedAdminId: r.assignedAdminId || undefined,
      assignedAdminName: r.assignedAdmin?.fullName || undefined,
      resolutionNotes: r.resolutionNotes || undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      reports: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getReportDetail(id: string): Promise<ReportRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporterUser: { select: { id: true, fullName: true, email: true, role: true } },
        reportedUser: { select: { id: true, fullName: true, email: true, role: true } },
        assignedAdmin: { select: { id: true, fullName: true, email: true } },
        booking: true,
      },
    });

    if (!report) {
      throw new AdminServiceError('Report not found.', 404);
    }

    return {
      id: report.id,
      reporterUserId: report.reporterUserId,
      reporterName: report.reporterUser?.fullName || undefined,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.reportedUser?.fullName || undefined,
      bookingId: report.bookingId,
      messageId: report.messageId,
      reviewId: report.reviewId,
      reason: report.reason,
      details: report.details,
      status: report.status as ReportStatus,
      priority: report.priority || undefined,
      assignedAdminId: report.assignedAdminId || undefined,
      assignedAdminName: report.assignedAdmin?.fullName || undefined,
      resolutionNotes: report.resolutionNotes || undefined,
      createdAt: report.createdAt.toISOString(),
    };
  }

  static async updateReport(
    adminUserId: string,
    id: string,
    data: {
      status?: ReportStatus;
      priority?: string;
      assignedAdminId?: string;
      resolutionNotes?: string;
    },
    ipAddress?: string
  ): Promise<ReportRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new AdminServiceError('Report not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.report.update({
        where: { id },
        data: {
          status: data.status as any,
          priority: data.priority,
          assignedAdminId: data.assignedAdminId,
          resolutionNotes: data.resolutionNotes,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'REPORT_UPDATE',
          entityType: 'Report',
          entityId: id,
          reason: data.resolutionNotes || `Updated report status to ${data.status}`,
          metadata: data,
          ipAddress,
        },
        tx
      );

      return r;
    });

    return AdminService.getReportDetail(updated.id);
  }

  // ==========================================
  // 9. DISPUTES OPERATIONS
  // ==========================================
  static async createDispute(
    openedByUserId: string,
    input: CreateDisputeInput
  ): Promise<DisputeRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const anyInput = input as any;
    const issueSummary = (input.issueSummary || anyInput.description || '').trim();
    const detailedDescription = (input.detailedDescription || anyInput.description || issueSummary).trim();

    if (!input.bookingId || !input.category || !issueSummary) {
      throw new AdminServiceError('Booking ID, category, and issue summary are required.', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        providerProfile: true,
      },
    });

    if (!booking) {
      throw new AdminServiceError('Booking not found.', 404);
    }

    const isCustomer = booking.customerId === openedByUserId;
    const isProvider = booking.providerProfile?.userId === openedByUserId;

    if (!isCustomer && !isProvider) {
      throw new AdminServiceError('Forbidden: You can only file a dispute on a booking you are party to.', 403);
    }

    const respondentUserId = isCustomer
      ? booking.providerProfile?.userId || null
      : booking.customerId;

    const caseNumber = `DSP-${Math.floor(100000 + Math.random() * 900000)}`;

    const dispute = await prisma.dispute.create({
      data: {
        caseNumber,
        bookingId: booking.id,
        openedByUserId,
        respondentUserId,
        category: input.category,
        priority: (input.priority as DisputePriority) || 'MEDIUM',
        status: 'OPEN',
        amountInvolvedPaise: input.amountInvolvedPaise || null,
        issueSummary,
        detailedDescription,
      },
      include: {
        openedByUser: { select: { fullName: true, email: true } },
        respondentUser: { select: { fullName: true, email: true } },
      },
    });

    return {
      id: dispute.id,
      caseNumber: dispute.caseNumber,
      bookingId: dispute.bookingId,
      openedByUserId: dispute.openedByUserId,
      openedByName: dispute.openedByUser?.fullName || undefined,
      respondentUserId: dispute.respondentUserId || undefined,
      respondentName: dispute.respondentUser?.fullName || undefined,
      category: dispute.category,
      priority: dispute.priority as any,
      status: dispute.status as any,
      issueSummary: dispute.issueSummary,
      detailedDescription: dispute.detailedDescription,
      amountInvolvedPaise: dispute.amountInvolvedPaise || undefined,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
    };
  }

  static async listDisputes(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    bookingId?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {};
    if (params.status) where.status = params.status as DisputeStatus;
    if (params.priority) where.priority = params.priority as DisputePriority;
    if (params.bookingId) where.bookingId = params.bookingId;

    const [total, records] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          openedByUser: { select: { fullName: true, email: true } },
          respondentUser: { select: { fullName: true, email: true } },
          assignedAdmin: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    const disputes: DisputeRecord[] = records.map((d) => ({
      id: d.id,
      caseNumber: d.caseNumber,
      bookingId: d.bookingId,
      openedByUserId: d.openedByUserId,
      openedByName: d.openedByUser?.fullName || undefined,
      respondentUserId: d.respondentUserId || undefined,
      respondentName: d.respondentUser?.fullName || undefined,
      category: d.category,
      priority: d.priority as any,
      status: d.status as any,
      issueSummary: d.issueSummary,
      detailedDescription: d.detailedDescription,
      amountInvolvedPaise: d.amountInvolvedPaise || undefined,
      assignedAdminId: d.assignedAdminId || undefined,
      assignedAdminName: d.assignedAdmin?.fullName || undefined,
      resolutionSummary: d.resolutionSummary || undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      resolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : undefined,
    }));

    return {
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getDisputeDetail(id: string, userRole?: string): Promise<DisputeRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const d = await prisma.dispute.findUnique({
      where: { id },
      include: {
        openedByUser: { select: { fullName: true, email: true } },
        respondentUser: { select: { fullName: true, email: true } },
        assignedAdmin: { select: { fullName: true, email: true } },
        booking: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!d) {
      throw new AdminServiceError('Dispute record not found.', 404);
    }

    return {
      id: d.id,
      caseNumber: d.caseNumber,
      bookingId: d.bookingId,
      openedByUserId: d.openedByUserId,
      openedByName: d.openedByUser?.fullName || undefined,
      respondentUserId: d.respondentUserId || undefined,
      respondentName: d.respondentUser?.fullName || undefined,
      category: d.category,
      priority: d.priority as any,
      status: d.status as any,
      issueSummary: d.issueSummary,
      detailedDescription: d.detailedDescription,
      amountInvolvedPaise: d.amountInvolvedPaise || undefined,
      assignedAdminId: d.assignedAdminId || undefined,
      assignedAdminName: d.assignedAdmin?.fullName || undefined,
      resolutionSummary: d.resolutionSummary || undefined,
      internalNotes: userRole === 'ADMIN' ? d.internalNotes || undefined : undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      resolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : undefined,
    };
  }

  static async transitionDispute(
    adminUserId: string,
    id: string,
    input: TransitionDisputeInput,
    ipAddress?: string
  ): Promise<DisputeRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throw new AdminServiceError('Dispute not found.', 404);
    }

    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      throw new AdminServiceError(`Cannot modify dispute that is already in '${dispute.status}' state.`, 400);
    }

    const anyInput = input as any;
    if (!input.status && anyInput.assignedAdminId) {
      return AdminService.assignDispute(adminUserId, id, anyInput.assignedAdminId, ipAddress);
    }

    const validTransitions: Record<string, string[]> = {
      OPEN: ['UNDER_REVIEW', 'CLOSED'],
      UNDER_REVIEW: ['WAITING_FOR_INFO', 'RESOLVED', 'CLOSED', 'ESCALATED'],
      WAITING_FOR_INFO: ['UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      ESCALATED: ['RESOLVED', 'CLOSED', 'UNDER_REVIEW'],
    };

    const allowed = validTransitions[dispute.status] || [];
    if (!allowed.includes(input.status)) {
      throw new AdminServiceError(
        `Invalid dispute status transition from '${dispute.status}' to '${input.status}'.`,
        400
      );
    }

    const resolutionSummary = input.resolutionSummary?.trim() || anyInput.resolution?.trim() || dispute.resolutionSummary;
    const isResolving = input.status === 'RESOLVED' || input.status === 'CLOSED';
    if (input.status === 'RESOLVED' && (!resolutionSummary || !resolutionSummary.trim())) {
      throw new AdminServiceError('A resolution summary is required when resolving a dispute.', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id },
        data: {
          status: input.status as DisputeStatus,
          resolutionSummary: resolutionSummary || dispute.resolutionSummary,
          internalNotes: input.internalNotes?.trim() || anyInput.notes?.trim() || dispute.internalNotes,
          resolvedAt: isResolving ? new Date() : dispute.resolvedAt,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'DISPUTE_TRANSITION',
          entityType: 'Dispute',
          entityId: id,
          reason: resolutionSummary || `Transitioned dispute to ${input.status}`,
          metadata: { previousStatus: dispute.status, newStatus: input.status },
          ipAddress,
        },
        tx
      );

      return d;
    });

    return AdminService.getDisputeDetail(updated.id, 'ADMIN');
  }

  static async assignDispute(
    adminUserId: string,
    id: string,
    assignedAdminId: string,
    ipAddress?: string
  ): Promise<DisputeRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const admin = await prisma.user.findFirst({
      where: { id: assignedAdminId, role: 'ADMIN' },
    });
    if (!admin) {
      throw new AdminServiceError('Assigned user must be an active administrator.', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id },
        data: { assignedAdminId },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'DISPUTE_ASSIGN',
          entityType: 'Dispute',
          entityId: id,
          reason: `Assigned dispute to admin ${admin.fullName}`,
          metadata: { assignedAdminId },
          ipAddress,
        },
        tx
      );

      return d;
    });

    return AdminService.getDisputeDetail(updated.id, 'ADMIN');
  }

  // ==========================================
  // 10. SUPPORT TICKETS
  // ==========================================
  static async createSupportTicket(
    requesterUserId: string,
    requesterRole: string,
    input: CreateSupportTicketInput
  ): Promise<SupportTicketRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!input.subject?.trim() || !input.description?.trim() || !input.category) {
      throw new AdminServiceError('Category, subject, and description are required.', 400);
    }

    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        requesterUserId,
        requesterRole,
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        category: input.category,
        subject: input.subject.trim(),
        description: input.description.trim(),
        priority: (input.priority as SupportTicketPriority) || 'MEDIUM',
        status: 'OPEN',
        bookingId: input.bookingId || null,
      },
      include: {
        requesterUser: { select: { fullName: true, email: true } },
      },
    });

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      requesterUserId: ticket.requesterUserId,
      requesterName: ticket.requesterUser?.fullName || undefined,
      requesterRole: ticket.requesterRole,
      contactEmail: ticket.contactEmail || undefined,
      contactPhone: ticket.contactPhone || undefined,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority as any,
      status: ticket.status as any,
      bookingId: ticket.bookingId || undefined,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  static async listSupportTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};
    if (params.status) where.status = params.status as SupportTicketStatus;
    if (params.priority) where.priority = params.priority as SupportTicketPriority;
    if (params.category) where.category = params.category;

    const [total, records] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requesterUser: { select: { fullName: true, email: true } },
          assignedAdmin: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    const tickets: SupportTicketRecord[] = records.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      requesterUserId: t.requesterUserId,
      requesterName: t.requesterUser?.fullName || undefined,
      requesterRole: t.requesterRole,
      contactEmail: t.contactEmail || undefined,
      contactPhone: t.contactPhone || undefined,
      category: t.category,
      subject: t.subject,
      description: t.description,
      priority: t.priority as any,
      status: t.status as any,
      assignedAdminId: t.assignedAdminId || undefined,
      assignedAdminName: t.assignedAdmin?.fullName || undefined,
      bookingId: t.bookingId || undefined,
      resolutionNotes: t.resolutionNotes || undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : undefined,
    }));

    return {
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getSupportTicketDetail(id: string, userRole?: string): Promise<SupportTicketRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const t = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        requesterUser: { select: { fullName: true, email: true } },
        assignedAdmin: { select: { fullName: true, email: true } },
      },
    });

    if (!t) {
      throw new AdminServiceError('Support ticket not found.', 404);
    }

    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      requesterUserId: t.requesterUserId,
      requesterName: t.requesterUser?.fullName || undefined,
      requesterRole: t.requesterRole,
      contactEmail: t.contactEmail || undefined,
      contactPhone: t.contactPhone || undefined,
      category: t.category,
      subject: t.subject,
      description: t.description,
      priority: t.priority as any,
      status: t.status as any,
      assignedAdminId: t.assignedAdminId || undefined,
      assignedAdminName: t.assignedAdmin?.fullName || undefined,
      bookingId: t.bookingId || undefined,
      resolutionNotes: t.resolutionNotes || undefined,
      internalNotes: userRole === 'ADMIN' ? t.internalNotes || undefined : undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : undefined,
    };
  }

  static async updateSupportTicket(
    adminUserId: string,
    id: string,
    input: UpdateSupportTicketInput,
    ipAddress?: string
  ): Promise<SupportTicketRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new AdminServiceError('Support ticket not found.', 404);
    }

    if (ticket.status === 'CLOSED') {
      throw new AdminServiceError('Cannot modify a closed support ticket.', 400);
    }

    const isResolving = input.status === 'RESOLVED' || input.status === 'CLOSED';

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id },
        data: {
          status: input.status ? (input.status as SupportTicketStatus) : undefined,
          priority: input.priority ? (input.priority as SupportTicketPriority) : undefined,
          assignedAdminId: input.assignedAdminId !== undefined ? input.assignedAdminId : undefined,
          internalNotes: input.internalNotes?.trim() || undefined,
          resolutionNotes: input.resolutionNotes?.trim() || undefined,
          resolvedAt: isResolving ? new Date() : undefined,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'SUPPORT_TICKET_UPDATE',
          entityType: 'SupportTicket',
          entityId: id,
          reason: input.resolutionNotes || `Updated support ticket status to ${input.status || ticket.status}`,
          metadata: input as any,
          ipAddress,
        },
        tx
      );

      return t;
    });

    return AdminService.getSupportTicketDetail(updated.id, 'ADMIN');
  }

  // ==========================================
  // 11. TRUST & SAFETY CASES
  // ==========================================
  static async createTrustSafetyCase(
    adminUserId: string,
    input: CreateTrustSafetyCaseInput,
    ipAddress?: string
  ): Promise<TrustSafetyCaseRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const anyInput = input as any;
    const entityType = input.entityType || (anyInput.userId ? 'USER' : anyInput.providerId ? 'PROVIDER' : anyInput.bookingId ? 'BOOKING' : 'USER');
    const entityId = input.entityId || anyInput.userId || anyInput.providerId || anyInput.bookingId || '';
    const riskSignal = (input.riskSignal || anyInput.triggerReason || anyInput.caseType || '').trim();
    const severity = (input.severity || anyInput.priority || 'MEDIUM') as TrustSafetySeverity;

    if (!entityType || !entityId || !riskSignal) {
      throw new AdminServiceError('Entity type, entity ID, and factual risk signal are required.', 400);
    }

    const caseReference = `TSC-${Math.floor(100000 + Math.random() * 900000)}`;

    const created = await prisma.$transaction(async (tx) => {
      const c = await tx.trustSafetyCase.create({
        data: {
          caseReference,
          entityType,
          entityId,
          riskSignal,
          severity,
          status: 'FLAGGED',
          investigationNotes: input.investigationNotes?.trim() || null,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'TRUST_SAFETY_CASE_CREATE',
          entityType: 'TrustSafetyCase',
          entityId: c.id,
          reason: `Created trust & safety case for signal: ${riskSignal}`,
          metadata: { caseReference, entityType, entityId },
          ipAddress,
        },
        tx
      );

      return c;
    });

    return AdminService.getTrustSafetyCaseDetail(created.id);
  }

  static async listTrustSafetyCases(params: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    entityType?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TrustSafetyCaseWhereInput = {};
    if (params.status) where.status = params.status as TrustSafetyStatus;
    if (params.severity) where.severity = params.severity as TrustSafetySeverity;
    if (params.entityType) where.entityType = params.entityType;

    const [total, records] = await Promise.all([
      prisma.trustSafetyCase.count({ where }),
      prisma.trustSafetyCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAdmin: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    const cases: TrustSafetyCaseRecord[] = records.map((c) => ({
      id: c.id,
      caseReference: c.caseReference,
      entityType: c.entityType,
      entityId: c.entityId,
      riskSignal: c.riskSignal,
      severity: c.severity as any,
      status: c.status as any,
      assignedAdminId: c.assignedAdminId || undefined,
      assignedAdminName: c.assignedAdmin?.fullName || undefined,
      investigationNotes: c.investigationNotes || undefined,
      resolutionSummary: c.resolutionSummary || undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : undefined,
    }));

    return {
      cases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getTrustSafetyCaseDetail(id: string): Promise<TrustSafetyCaseRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const c = await prisma.trustSafetyCase.findUnique({
      where: { id },
      include: {
        assignedAdmin: { select: { fullName: true, email: true } },
      },
    });

    if (!c) {
      throw new AdminServiceError('Trust & Safety case not found.', 404);
    }

    return {
      id: c.id,
      caseReference: c.caseReference,
      entityType: c.entityType,
      entityId: c.entityId,
      riskSignal: c.riskSignal,
      severity: c.severity as any,
      status: c.status as any,
      assignedAdminId: c.assignedAdminId || undefined,
      assignedAdminName: c.assignedAdmin?.fullName || undefined,
      investigationNotes: c.investigationNotes || undefined,
      resolutionSummary: c.resolutionSummary || undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : undefined,
    };
  }

  static async updateTrustSafetyCase(
    adminUserId: string,
    id: string,
    input: UpdateTrustSafetyCaseInput,
    ipAddress?: string
  ): Promise<TrustSafetyCaseRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const existing = await prisma.trustSafetyCase.findUnique({ where: { id } });
    if (!existing) {
      throw new AdminServiceError('Trust & Safety case not found.', 404);
    }

    const anyInput = input as any;
    let targetStatus = input.status;
    if ((targetStatus as string) === 'RESOLVED') {
      targetStatus = 'CLEARED' as any;
    }

    const resolutionNotes = input.resolutionSummary?.trim() || anyInput.resolution?.trim() || undefined;
    const isResolving = targetStatus === 'CLEARED' || targetStatus === 'RESTRICTED';

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.trustSafetyCase.update({
        where: { id },
        data: {
          status: targetStatus ? (targetStatus as TrustSafetyStatus) : undefined,
          severity: input.severity ? (input.severity as TrustSafetySeverity) : undefined,
          assignedAdminId: input.assignedAdminId !== undefined ? input.assignedAdminId : undefined,
          investigationNotes: input.investigationNotes?.trim() || anyInput.internalNotes?.trim() || undefined,
          resolutionSummary: resolutionNotes,
          resolvedAt: isResolving ? new Date() : undefined,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'TRUST_SAFETY_CASE_UPDATE',
          entityType: 'TrustSafetyCase',
          entityId: id,
          reason: input.resolutionSummary || `Updated case status to ${input.status || existing.status}`,
          metadata: input as any,
          ipAddress,
        },
        tx
      );

      return c;
    });

    return AdminService.getTrustSafetyCaseDetail(updated.id);
  }

  // ==========================================
  // 12. PLATFORM SETTINGS & FINANCIAL POLICIES
  // ==========================================
  static async getSettings(): Promise<PlatformSettingRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    let settings = await prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });

    if (settings.length === 0) {
      const defaultSettings = [
        { key: 'PLATFORM_COMMISSION_PERCENT', value: '10', description: 'Platform commission percentage (0-100)', category: 'FINANCIAL' },
        { key: 'CANCELLATION_FREE_WINDOW_HOURS', value: '2', description: 'Hours before scheduled service where cancellation is 100% free', category: 'POLICY' },
        { key: 'CANCELLATION_LATE_FEE_PERCENT', value: '20', description: 'Late cancellation fee percentage applied to refund', category: 'POLICY' },
        { key: 'MAINTENANCE_MODE', value: 'false', description: 'Operational maintenance mode status', category: 'SYSTEM' },
        { key: 'PROVIDER_VERIFICATION_REQUIRED', value: 'false', description: 'Whether provider verification is strictly required for public search', category: 'POLICY' },
      ];

      for (const ds of defaultSettings) {
        await prisma.platformSetting.create({
          data: ds,
        });
      }

      settings = await prisma.platformSetting.findMany({
        orderBy: { key: 'asc' },
      });
    }

    return settings.map((s) => ({
      key: s.key,
      value: s.value,
      description: s.description || undefined,
      category: s.category || undefined,
      updatedByAdminId: s.updatedByAdminId || undefined,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  static async updateSetting(
    adminUserId: string,
    key: string,
    value: string,
    description?: string,
    ipAddress?: string
  ): Promise<PlatformSettingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!key || value === undefined || value === null) {
      throw new AdminServiceError('Setting key and value are required.', 400);
    }

    if (key === 'PLATFORM_COMMISSION_PERCENT') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new AdminServiceError('Platform commission percent must be an integer between 0 and 100.', 400);
      }
      FinancialPolicyService.setPolicyOverride({ platformCommissionPercent: num });
    } else if (key === 'CANCELLATION_FREE_WINDOW_HOURS') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new AdminServiceError('Cancellation free window hours must be greater than or equal to 0.', 400);
      }
      FinancialPolicyService.setPolicyOverride({ cancellationFreeWindowHours: num });
    } else if (key === 'CANCELLATION_LATE_FEE_PERCENT') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new AdminServiceError('Late cancellation fee percent must be an integer between 0 and 100.', 400);
      }
      FinancialPolicyService.setPolicyOverride({ cancellationLateFeePercent: num });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.platformSetting.upsert({
        where: { key },
        create: {
          key,
          value,
          description: description || null,
          updatedByAdminId: adminUserId,
        },
        update: {
          value,
          description: description !== undefined ? description : undefined,
          updatedByAdminId: adminUserId,
        },
      });

      await AuditService.log(
        {
          actorUserId: adminUserId,
          action: 'PLATFORM_SETTING_UPDATE',
          entityType: 'PlatformSetting',
          entityId: s.key,
          reason: `Updated setting ${key} to ${value}`,
          metadata: { key, value },
          ipAddress,
        },
        tx
      );

      return s;
    });

    return {
      key: updated.key,
      value: updated.value,
      description: updated.description || undefined,
      category: updated.category || undefined,
      updatedByAdminId: updated.updatedByAdminId || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
