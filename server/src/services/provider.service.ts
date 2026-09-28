import { getPrismaClient } from '../config/database.js';
import type {
  ProviderProfileData,
  UpdateProviderProfileRequest,
  ProviderSkillItem,
  CreateProviderSkillRequest,
  ProviderServiceRecord,
  CreateProviderServiceRequest,
  UpdateProviderServiceRequest,
  ProviderServiceAreaRecord,
  SetProviderServiceAreaRequest,
  ProviderOnboardingState,
  PublicProviderProfile,
  OnboardingSectionStatus,
} from '@sevasetu/shared';

export class ProviderService {
  private static get prisma() {
    const client = getPrismaClient();
    if (!client) throw new Error('Database client not initialized');
    return client;
  }

  /**
   * Resolves or auto-initializes the provider profile for an authenticated PROVIDER user.
   */
  static async getOrCreateProviderProfile(userId: string): Promise<ProviderProfileData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'PROVIDER' && user.role !== 'ADMIN') {
      throw new Error('User does not have a SERVICE_PROVIDER role');
    }

    let profile = user.providerProfile;

    if (!profile) {
      profile = await this.prisma.serviceProviderProfile.create({
        data: {
          userId,
          businessName: user.fullName ? `${user.fullName} Services` : null,
          bio: null,
          experienceYears: 0,
          languages: ['Hindi', 'English'],
          onboardingStatus: 'NOT_STARTED',
          isPubliclyListed: false,
        },
      });
    }

    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      bio: profile.bio,
      experienceYears: profile.experienceYears,
      languages: profile.languages,
      serviceAreaSummary: profile.serviceAreaSummary,
      avatarUrl: profile.avatarUrl,
      isPubliclyListed: profile.isPubliclyListed,
      onboardingStatus: profile.onboardingStatus,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Updates provider profile fields.
   */
  static async updateProviderProfile(
    userId: string,
    data: UpdateProviderProfileRequest
  ): Promise<ProviderProfileData> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { id: profile.id },
      data: {
        businessName: data.businessName !== undefined ? data.businessName.trim() || null : undefined,
        bio: data.bio !== undefined ? data.bio.trim() || null : undefined,
        experienceYears:
          data.experienceYears !== undefined ? Math.max(0, Math.floor(data.experienceYears)) : undefined,
        languages: data.languages !== undefined ? data.languages : undefined,
        serviceAreaSummary:
          data.serviceAreaSummary !== undefined ? data.serviceAreaSummary.trim() || null : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl.trim() || null : undefined,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      businessName: updated.businessName,
      bio: updated.bio,
      experienceYears: updated.experienceYears,
      languages: updated.languages,
      serviceAreaSummary: updated.serviceAreaSummary,
      avatarUrl: updated.avatarUrl,
      isPubliclyListed: updated.isPubliclyListed,
      onboardingStatus: updated.onboardingStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Returns skills associated with this provider profile.
   */
  static async getSkills(userId: string): Promise<ProviderSkillItem[]> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const skills = await this.prisma.providerSkill.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return skills.map((s) => ({
      id: s.id,
      providerProfileId: s.providerProfileId,
      name: s.name,
      category: s.category,
      experienceLevel: s.experienceLevel as 'beginner' | 'intermediate' | 'expert',
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /**
   * Adds a skill to the provider profile.
   */
  static async addSkill(
    userId: string,
    data: CreateProviderSkillRequest
  ): Promise<ProviderSkillItem> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const name = data.name.trim();
    const category = data.category.trim();

    if (!name || !category) {
      throw new Error('Skill name and category are required');
    }

    const created = await this.prisma.providerSkill.create({
      data: {
        providerProfileId: profile.id,
        name,
        category,
        experienceLevel: data.experienceLevel || 'intermediate',
      },
    });

    return {
      id: created.id,
      providerProfileId: created.providerProfileId,
      name: created.name,
      category: created.category,
      experienceLevel: created.experienceLevel as 'beginner' | 'intermediate' | 'expert',
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Removes a skill from the provider profile.
   */
  static async removeSkill(userId: string, skillId: string): Promise<void> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const existing = await this.prisma.providerSkill.findFirst({
      where: { id: skillId, providerProfileId: profile.id },
    });

    if (!existing) {
      throw new Error('Skill not found or unauthorized');
    }

    await this.prisma.providerSkill.delete({
      where: { id: skillId },
    });
  }

  /**
   * Returns catalog services configured by the provider.
   */
  static async getServices(userId: string): Promise<ProviderServiceRecord[]> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const records = await this.prisma.providerService.findMany({
      where: { providerProfileId: profile.id },
      include: {
        service: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      providerProfileId: r.providerProfileId,
      serviceId: r.serviceId,
      service: {
        id: r.service.id,
        categoryId: r.service.categoryId,
        categoryName: r.service.category.name,
        title: r.service.title,
        slug: r.service.slug,
        description: r.service.description,
        serviceType: r.service.serviceType,
        pricingModel: r.service.pricingModel,
        basePrice: r.service.basePrice,
        currency: 'INR',
        durationMinutes: r.service.durationMinutes,
        includedFeatures: r.service.includedFeatures,
        isActive: r.service.isActive,
      },
      customTitle: r.customTitle,
      description: r.description,
      pricingModel: r.pricingModel,
      customPrice: r.customPrice,
      minDuration: r.minDuration,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Associates a catalog service with the provider profile.
   */
  static async addService(
    userId: string,
    data: CreateProviderServiceRequest
  ): Promise<ProviderServiceRecord> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const catalogService = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { category: true },
    });

    if (!catalogService || !catalogService.isActive) {
      throw new Error('Catalog service not found or is currently inactive');
    }

    const created = await this.prisma.providerService.upsert({
      where: {
        providerProfileId_serviceId: {
          providerProfileId: profile.id,
          serviceId: data.serviceId,
        },
      },
      update: {
        customTitle: data.customTitle?.trim() || null,
        description: data.description?.trim() || null,
        pricingModel: data.pricingModel || catalogService.pricingModel,
        customPrice: data.customPrice !== undefined ? data.customPrice : catalogService.basePrice,
        minDuration: data.minDuration?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      create: {
        providerProfileId: profile.id,
        serviceId: data.serviceId,
        customTitle: data.customTitle?.trim() || null,
        description: data.description?.trim() || null,
        pricingModel: data.pricingModel || catalogService.pricingModel,
        customPrice: data.customPrice !== undefined ? data.customPrice : catalogService.basePrice,
        minDuration: data.minDuration?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        service: {
          include: { category: true },
        },
      },
    });

    return {
      id: created.id,
      providerProfileId: created.providerProfileId,
      serviceId: created.serviceId,
      service: {
        id: created.service.id,
        categoryId: created.service.categoryId,
        categoryName: created.service.category.name,
        title: created.service.title,
        slug: created.service.slug,
        description: created.service.description,
        serviceType: created.service.serviceType,
        pricingModel: created.service.pricingModel,
        basePrice: created.service.basePrice,
        currency: 'INR',
        durationMinutes: created.service.durationMinutes,
        includedFeatures: created.service.includedFeatures,
        isActive: created.service.isActive,
      },
      customTitle: created.customTitle,
      description: created.description,
      pricingModel: created.pricingModel,
      customPrice: created.customPrice,
      minDuration: created.minDuration,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Updates an existing provider service configuration.
   */
  static async updateService(
    userId: string,
    providerServiceId: string,
    data: UpdateProviderServiceRequest
  ): Promise<ProviderServiceRecord> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const existing = await this.prisma.providerService.findFirst({
      where: { id: providerServiceId, providerProfileId: profile.id },
      include: { service: { include: { category: true } } },
    });

    if (!existing) {
      throw new Error('Provider service not found or unauthorized');
    }

    const updated = await this.prisma.providerService.update({
      where: { id: providerServiceId },
      data: {
        customTitle: data.customTitle !== undefined ? data.customTitle.trim() || null : undefined,
        description: data.description !== undefined ? data.description.trim() || null : undefined,
        pricingModel: data.pricingModel !== undefined ? data.pricingModel : undefined,
        customPrice: data.customPrice !== undefined ? data.customPrice : undefined,
        minDuration: data.minDuration !== undefined ? data.minDuration.trim() || null : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: { service: { include: { category: true } } },
    });

    return {
      id: updated.id,
      providerProfileId: updated.providerProfileId,
      serviceId: updated.serviceId,
      service: {
        id: updated.service.id,
        categoryId: updated.service.categoryId,
        categoryName: updated.service.category.name,
        title: updated.service.title,
        slug: updated.service.slug,
        description: updated.service.description,
        serviceType: updated.service.serviceType,
        pricingModel: updated.service.pricingModel,
        basePrice: updated.service.basePrice,
        currency: 'INR',
        durationMinutes: updated.service.durationMinutes,
        includedFeatures: updated.service.includedFeatures,
        isActive: updated.service.isActive,
      },
      customTitle: updated.customTitle,
      description: updated.description,
      pricingModel: updated.pricingModel,
      customPrice: updated.customPrice,
      minDuration: updated.minDuration,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Removes a provider service.
   */
  static async removeService(userId: string, providerServiceId: string): Promise<void> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const existing = await this.prisma.providerService.findFirst({
      where: { id: providerServiceId, providerProfileId: profile.id },
    });

    if (!existing) {
      throw new Error('Provider service not found or unauthorized');
    }

    await this.prisma.providerService.delete({
      where: { id: providerServiceId },
    });
  }

  /**
   * Returns provider service areas.
   */
  static async getServiceAreas(userId: string): Promise<ProviderServiceAreaRecord[]> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const areas = await this.prisma.providerServiceArea.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return areas.map((a) => ({
      id: a.id,
      providerProfileId: a.providerProfileId,
      city: a.city,
      locality: a.locality,
      state: a.state,
      postalCode: a.postalCode,
      radiusKm: a.radiusKm,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  /**
   * Sets or updates provider service area.
   */
  static async setServiceArea(
    userId: string,
    data: SetProviderServiceAreaRequest
  ): Promise<ProviderServiceAreaRecord> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const city = data.city.trim();
    const locality = data.locality.trim();
    const postalCode = (data.postalCode || (data.postalCodes && data.postalCodes[0]) || '').trim();
    const state = data.state?.trim() || 'Uttar Pradesh';
    const radiusKm = data.radiusKm || 10.0;

    if (!city || !locality || !postalCode) {
      throw new Error('City, locality, and postal code are required');
    }

    const summary = `${locality}, ${city} (${postalCode}) — within ${radiusKm}km`;

    return await this.prisma.$transaction(async (tx) => {
      // Upsert primary service area for this provider
      const existing = await tx.providerServiceArea.findFirst({
        where: { providerProfileId: profile.id },
      });

      let area;
      if (existing) {
        area = await tx.providerServiceArea.update({
          where: { id: existing.id },
          data: {
            city,
            locality,
            state,
            postalCode,
            radiusKm,
          },
        });
      } else {
        area = await tx.providerServiceArea.create({
          data: {
            providerProfileId: profile.id,
            city,
            locality,
            state,
            postalCode,
            radiusKm,
          },
        });
      }

      // Update provider profile summary
      await tx.serviceProviderProfile.update({
        where: { id: profile.id },
        data: {
          serviceAreaSummary: summary,
        },
      });

      return {
        id: area.id,
        providerProfileId: area.providerProfileId,
        city: area.city,
        locality: area.locality,
        state: area.state,
        postalCode: area.postalCode,
        radiusKm: area.radiusKm,
        createdAt: area.createdAt.toISOString(),
        updatedAt: area.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Evaluates the onboarding checklist and returns real data-driven status.
   */
  static async getOnboardingState(userId: string): Promise<ProviderOnboardingState> {
    const profile = await this.getOrCreateProviderProfile(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const [skillsCount, servicesCount, areasCount] = await Promise.all([
      this.prisma.providerSkill.count({ where: { providerProfileId: profile.id } }),
      this.prisma.providerService.count({ where: { providerProfileId: profile.id, isActive: true } }),
      this.prisma.providerServiceArea.count({ where: { providerProfileId: profile.id } }),
    ]);

    const isProfileComplete = Boolean(
      (user?.fullName || profile.businessName) && profile.bio && profile.bio.trim().length >= 15
    );
    const hasSkills = skillsCount > 0;
    const hasServices = servicesCount > 0;
    const hasArea = areasCount > 0 || Boolean(profile.serviceAreaSummary);

    const sections: OnboardingSectionStatus[] = [
      {
        id: 'profile',
        title: 'Professional Bio & Experience',
        isComplete: isProfileComplete,
        required: true,
        details: isProfileComplete
          ? 'Profile bio and identity configured'
          : 'Please add your professional name and bio (at least 15 characters)',
      },
      {
        id: 'skills',
        title: 'Trade Skills & Capabilities',
        isComplete: hasSkills,
        required: true,
        details: hasSkills
          ? `${skillsCount} skill(s) registered`
          : 'Please add at least 1 trade skill or speciality',
      },
      {
        id: 'services',
        title: 'Offered Catalog Services',
        isComplete: hasServices,
        required: true,
        details: hasServices
          ? `${servicesCount} service package(s) offered`
          : 'Please select at least 1 service offering from the catalog',
      },
      {
        id: 'area',
        title: 'Service Area Boundaries',
        isComplete: hasArea,
        required: true,
        details: hasArea
          ? profile.serviceAreaSummary || 'Service locality configured'
          : 'Please set your operating city and postal code',
      },
    ];

    const completedCount = sections.filter((s) => s.isComplete).length;
    const completionPercentage = Math.round((completedCount / sections.length) * 100);
    const isAllComplete = completedCount === sections.length;

    let derivedStatus = profile.onboardingStatus;
    if (profile.onboardingStatus !== 'COMPLETED') {
      derivedStatus = completedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    }

    return {
      status: derivedStatus,
      isComplete: profile.onboardingStatus === 'COMPLETED' || isAllComplete,
      completionPercentage,
      sections,
      profile,
    };
  }

  /**
   * Completes provider onboarding once all required sections are verified.
   * Activates public listing eligibility.
   */
  static async completeOnboarding(userId: string): Promise<ProviderOnboardingState> {
    const onboardingState = await this.getOnboardingState(userId);

    const incomplete = onboardingState.sections.filter((s) => s.required && !s.isComplete);
    if (incomplete.length > 0) {
      const missingTitles = incomplete.map((i) => i.title).join(', ');
      throw new Error(`Cannot complete onboarding. Please complete required sections: ${missingTitles}`);
    }

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { id: onboardingState.profile!.id },
      data: {
        onboardingStatus: 'COMPLETED',
        isPubliclyListed: true,
      },
    });

    return {
      ...onboardingState,
      status: 'COMPLETED',
      isComplete: true,
      completionPercentage: 100,
      profile: {
        ...onboardingState.profile!,
        onboardingStatus: 'COMPLETED',
        isPubliclyListed: true,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Retrieves safe, sanitized public provider profile for customer discovery.
   * Strictly hides email, phone, passwords, and private internal notes.
   * Returns null if provider does not exist, or is not completed/publicly listed.
   */
  static async getPublicProviderProfile(providerId: string): Promise<PublicProviderProfile | null> {
    const profile = await this.prisma.serviceProviderProfile.findFirst({
      where: {
        OR: [{ id: providerId }, { userId: providerId }],
        onboardingStatus: 'COMPLETED',
        isPubliclyListed: true,
        user: { status: 'ACTIVE' },
      },
      include: {
        user: {
          select: {
            fullName: true,
            createdAt: true,
          },
        },
        skills: {
          select: { name: true },
        },
        services: {
          where: { isActive: true },
          include: {
            service: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      displayName: profile.businessName || profile.user.fullName || 'Verified Local Partner',
      bio: profile.bio || '',
      experienceYears: profile.experienceYears,
      languages: profile.languages,
      avatarUrl: profile.avatarUrl,
      serviceAreaSummary: profile.serviceAreaSummary,
      skills: profile.skills.map((s) => s.name),
      services: profile.services.map((ps) => ({
        id: ps.service.id,
        title: ps.customTitle || ps.service.title,
        categoryName: ps.service.category.name,
        pricingModel: ps.pricingModel || ps.service.pricingModel,
        basePrice: ps.customPrice !== null ? ps.customPrice : ps.service.basePrice,
      })),
      isPubliclyListed: profile.isPubliclyListed,
      createdAt: profile.createdAt.toISOString(),
    };
  }
}
