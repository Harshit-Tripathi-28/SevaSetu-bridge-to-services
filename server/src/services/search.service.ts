import { getPrismaClient } from '../config/database.js';
import { AvailabilityService } from './availability.service.js';
import type {
  ProviderSearchQuery,
  ProviderSearchResponse,
  ProviderSearchResultItem,
  MatchReason,
  CatalogPricingModel,
  MatchedServiceInfo,
} from '@sevasetu/shared';
import { Prisma } from '@prisma/client';

/**
 * Transparent Deterministic Match Scoring Weights
 * Total potential score: 100
 * - Service Offering Match: 40 points (Direct catalog capability to fulfill requested work)
 * - Service Area Coverage: 25 points (Confirmed coverage of customer's operational locality/city)
 * - Verified Schedule Availability: 20 points (Available without shift or calendar conflict)
 * - Relevant Skill Competency: 10 points (Holds specific trade skills in category)
 * - Experience Seniority: up to 5 points (1 point per 2 years, capped at 5)
 */
const SCORE_SERVICE_MATCH = 40;
const SCORE_LOCATION_MATCH = 25;
const SCORE_SCHEDULE_MATCH = 20;
const SCORE_SKILL_MATCH = 10;
const MAX_EXPERIENCE_SCORE = 5;

export class SearchService {
  /**
   * Search for verified, onboarded, publicly listed service providers matching
   * catalog service, service area, and optional date/time availability criteria.
   */
  static async searchProviders(query: ProviderSearchQuery): Promise<ProviderSearchResponse> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

    // Base Prisma where clause strictly enforcing real eligibility rules
    const where: Prisma.ServiceProviderProfileWhereInput = {
      user: {
        status: 'ACTIVE',
      },
      onboardingStatus: 'COMPLETED',
      isPubliclyListed: true,
      isRestricted: false,
    };

    // Filter by specific catalog service or category
    if (query.serviceId) {
      where.services = {
        some: {
          serviceId: query.serviceId,
          isActive: true,
        },
      };
    } else if (query.categorySlug) {
      where.services = {
        some: {
          isActive: true,
          service: {
            category: {
              slug: query.categorySlug.toLowerCase(),
            },
          },
        },
      };
    } else if (query.categoryId) {
      where.services = {
        some: {
          isActive: true,
          service: {
            categoryId: query.categoryId,
          },
        },
      };
    }

    // Filter by location / service area
    const locationConditions: Prisma.ProviderServiceAreaWhereInput[] = [];
    if (query.city && query.city.trim()) {
      locationConditions.push({
        city: { contains: query.city.trim(), mode: 'insensitive' },
      });
    }
    if (query.locality && query.locality.trim()) {
      locationConditions.push({
        locality: { contains: query.locality.trim(), mode: 'insensitive' },
      });
    }
    if (query.postalCode && query.postalCode.trim()) {
      locationConditions.push({
        postalCode: { equals: query.postalCode.trim() },
      });
    }

    if (locationConditions.length > 0) {
      where.serviceAreas = {
        some: {
          OR: locationConditions,
        },
      };
    }

    // Filter by keyword if provided (searches businessName, bio, skills, or service title)
    if (query.keyword && query.keyword.trim()) {
      const kw = query.keyword.trim();
      where.OR = [
        { businessName: { contains: kw, mode: 'insensitive' } },
        { bio: { contains: kw, mode: 'insensitive' } },
        {
          skills: {
            some: {
              name: { contains: kw, mode: 'insensitive' },
            },
          },
        },
        {
          services: {
            some: {
              isActive: true,
              OR: [
                { customTitle: { contains: kw, mode: 'insensitive' } },
                { description: { contains: kw, mode: 'insensitive' } },
                {
                  service: {
                    title: { contains: kw, mode: 'insensitive' },
                  },
                },
              ],
            },
          },
        },
      ];
    }

    // Fetch matching candidate profiles with required relational data
    const candidates = await prisma.serviceProviderProfile.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        skills: true,
        services: {
          where: { isActive: true },
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
        serviceAreas: true,
        availabilities: true,
        availabilityOverrides: true,
      },
    });

    // Evaluate availability and compute deterministic scoring for each candidate
    const scoredCandidates: ProviderSearchResultItem[] = [];

    for (const p of candidates) {
      let isAvailableForSchedule: boolean | undefined = undefined;

      // Date/Time availability filter evaluation
      if (query.date) {
        const availCheck = await AvailabilityService.checkProviderAvailability(
          p.id,
          query.date,
          query.startTime,
          query.durationHours || 1
        );

        isAvailableForSchedule = availCheck.isAvailable;

        // If customer provided date/time, exclude candidates who are unavailable
        if (!availCheck.isAvailable) {
          continue;
        }
      }

      // Compute deterministic match score and explainable reasons
      let matchScore = 0;
      const matchReasons: MatchReason[] = [];

      // 1. Service Offering Match
      let matchedService: MatchedServiceInfo | undefined = undefined;
      const relevantService = p.services.find((ps: (typeof p.services)[number]) => {
        if (query.serviceId) return ps.serviceId === query.serviceId;
        if (query.categorySlug) return ps.service.category.slug === query.categorySlug;
        return true;
      }) || p.services[0];

      if (relevantService) {
        matchScore += SCORE_SERVICE_MATCH;
        const svcTitle = relevantService.customTitle || relevantService.service.title;
        matchReasons.push({
          code: 'SERVICE_MATCH',
          message: `Offers requested service: ${svcTitle}`,
        });

        const price = relevantService.customPrice ?? relevantService.service.basePrice ?? null;
        const pricingModel = (relevantService.pricingModel || relevantService.service.pricingModel) as CatalogPricingModel;

        matchedService = {
          id: relevantService.id,
          serviceId: relevantService.serviceId,
          serviceTitle: svcTitle,
          categorySlug: relevantService.service.category.slug,
          pricingModel,
          price: price !== null ? Number(price) : null,
          customDescription: relevantService.description,
        };
      }

      // 2. Service Area Coverage Match
      const matchedArea = p.serviceAreas.find((sa: (typeof p.serviceAreas)[number]) => {
        if (query.postalCode && sa.postalCode === query.postalCode) return true;
        if (query.city && sa.city.toLowerCase().includes(query.city.toLowerCase())) return true;
        if (query.locality && sa.locality.toLowerCase().includes(query.locality.toLowerCase())) return true;
        return false;
      });

      if (matchedArea) {
        matchScore += SCORE_LOCATION_MATCH;
        matchReasons.push({
          code: 'LOCATION_COVERED',
          message: `Covers service territory in ${matchedArea.city} (${matchedArea.postalCode})`,
        });
      } else if (p.serviceAreas.length > 0) {
        // Partial location match if provider has service area configured
        matchScore += Math.floor(SCORE_LOCATION_MATCH / 2);
        matchReasons.push({
          code: 'SERVICE_AREA_AVAILABLE',
          message: `Operates in ${p.serviceAreas[0]?.city || 'assigned service area'}`,
        });
      }

      // 3. Schedule Availability Match
      if (isAvailableForSchedule === true) {
        matchScore += SCORE_SCHEDULE_MATCH;
        const slotText = query.startTime ? ` at ${query.startTime}` : '';
        matchReasons.push({
          code: 'SCHEDULE_AVAILABLE',
          message: `Available on requested date ${query.date}${slotText}`,
        });
      } else if (!query.date && p.availabilities.some((a: (typeof p.availabilities)[number]) => a.isAvailable)) {
        // Base recurring weekly availability established
        matchScore += Math.floor(SCORE_SCHEDULE_MATCH / 2);
        matchReasons.push({
          code: 'WEEKLY_SCHEDULE_ACTIVE',
          message: 'Active operating hours configured',
        });
      }

      // 4. Skills Match
      if (p.skills.length > 0) {
        matchScore += SCORE_SKILL_MATCH;
        const topSkills = p.skills.slice(0, 2).map((s: (typeof p.skills)[number]) => s.name).join(', ');
        matchReasons.push({
          code: 'SKILL_MATCH',
          message: `Holds trade capabilities in ${topSkills}`,
        });
      }

      // 5. Seniority Experience Score
      const expPoints = Math.min(MAX_EXPERIENCE_SCORE, Math.floor(p.experienceYears / 2));
      matchScore += expPoints;
      if (p.experienceYears > 0) {
        matchReasons.push({
          code: 'EXPERIENCE',
          message: `${p.experienceYears} ${p.experienceYears === 1 ? 'year' : 'years'} of professional trade experience`,
        });
      }

      const displayName =
        p.businessName || p.user.fullName || 'Verified Specialist';

      scoredCandidates.push({
        id: p.id,
        userId: p.userId,
        businessName: p.businessName,
        displayName,
        bio: p.bio,
        experienceYears: p.experienceYears,
        avatarUrl: p.avatarUrl,
        serviceAreaSummary: p.serviceAreaSummary,
        serviceAreas: p.serviceAreas.map((sa: (typeof p.serviceAreas)[number]) => ({
          city: sa.city,
          locality: sa.locality,
          state: sa.state,
          postalCode: sa.postalCode,
          radiusKm: sa.radiusKm,
        })),
        skills: p.skills.map((s: (typeof p.skills)[number]) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          experienceLevel: s.experienceLevel,
        })),
        offeredServices: p.services.map((s: (typeof p.services)[number]) => ({
          id: s.id,
          serviceId: s.serviceId,
          serviceTitle: s.customTitle || s.service.title,
          categorySlug: s.service.category.slug,
          pricingModel: (s.pricingModel || s.service.pricingModel) as CatalogPricingModel,
          price: s.customPrice ?? s.service.basePrice ?? null,
        })),
        matchedService,
        isAvailableForSchedule,
        matchScore,
        matchReasons,
      });
    }

    // Deterministic Sorting
    if (query.sortBy === 'experience') {
      scoredCandidates.sort((a, b) => b.experienceYears - a.experienceYears);
    } else if (query.sortBy === 'price_low') {
      scoredCandidates.sort((a, b) => {
        const pa = a.matchedService?.price ?? Infinity;
        const pb = b.matchedService?.price ?? Infinity;
        return pa - pb;
      });
    } else if (query.sortBy === 'price_high') {
      scoredCandidates.sort((a, b) => {
        const pa = a.matchedService?.price ?? -Infinity;
        const pb = b.matchedService?.price ?? -Infinity;
        return pb - pa;
      });
    } else {
      // Default: 'recommended' -> Sort by matchScore desc, then experienceYears desc, then id asc
      scoredCandidates.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        if (b.experienceYears !== a.experienceYears) {
          return b.experienceYears - a.experienceYears;
        }
        return a.id.localeCompare(b.id);
      });
    }

    // Pagination
    const total = scoredCandidates.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedResults = scoredCandidates.slice(startIndex, startIndex + limit);

    return {
      results: paginatedResults,
      total,
      page,
      limit,
      totalPages,
      filtersApplied: {
        keyword: query.keyword,
        serviceId: query.serviceId,
        categorySlug: query.categorySlug,
        city: query.city,
        postalCode: query.postalCode,
        date: query.date,
        startTime: query.startTime,
        durationHours: query.durationHours,
        sortBy: query.sortBy || 'recommended',
      },
    };
  }
}
