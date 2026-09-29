import { getPrismaClient } from '../config/database.js';
import type {
  DayOfWeek,
  SetAvailabilityRequest,
  CreateOverrideRequest,
  ProviderAvailabilitySchedule,
  AvailabilityCheckResponse,
} from '@sevasetu/shared';
import type { Prisma, ProviderAvailability, ProviderAvailabilityOverride } from '@prisma/client';

const VALID_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const h = Number(parts[0] ?? '0');
  const m = Number(parts[1] ?? '0');
  return h * 60 + m;
}

export function validateTimeFormat(timeStr: string, fieldName: string): void {
  if (!TIME_REGEX.test(timeStr)) {
    throw new Error(`Invalid format for ${fieldName}. Must be HH:mm (24-hour), e.g. "09:00".`);
  }
}

export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const day = days[date.getUTCDay()];
  return day || 'SUNDAY';
}

export class AvailabilityService {
  /**
   * Helper to resolve the provider profile for an authenticated user.
   */
  private static async getProfileByUserId(userId: string) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found for this user account.');
    }
    return profile;
  }

  /**
   * Get the full availability schedule (weekly + vacation mode + overrides) for a provider.
   */
  static async getProviderAvailability(userId: string): Promise<ProviderAvailabilitySchedule> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await this.getProfileByUserId(userId);

    const [availabilities, overrides] = await Promise.all([
      prisma.providerAvailability.findMany({
        where: { providerProfileId: profile.id },
        orderBy: { dayOfWeek: 'asc' },
      }),
      prisma.providerAvailabilityOverride.findMany({
        where: { providerProfileId: profile.id },
        orderBy: { date: 'asc' },
      }),
    ]);

    return {
      weeklySchedule: availabilities.map((a: ProviderAvailability) => ({
        id: a.id,
        providerProfileId: a.providerProfileId,
        dayOfWeek: a.dayOfWeek as DayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        breakStart: a.breakStart,
        breakEnd: a.breakEnd,
        isAvailable: a.isAvailable,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      vacationMode: profile.vacationMode,
      overrides: overrides.map((o: ProviderAvailabilityOverride) => ({
        id: o.id,
        providerProfileId: o.providerProfileId,
        date: o.date.toISOString().split('T')[0] as string,
        startTime: o.startTime,
        endTime: o.endTime,
        isAvailable: o.isAvailable,
        reason: o.reason,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Set or update weekly availability and optionally vacation mode in a transaction.
   */
  static async setWeeklyAvailability(
    userId: string,
    data: SetAvailabilityRequest
  ): Promise<ProviderAvailabilitySchedule> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await this.getProfileByUserId(userId);

    if (!Array.isArray(data.weeklySchedule)) {
      throw new Error('weeklySchedule must be an array of day schedules.');
    }

    // Validate each day's schedule
    const validatedDays = new Set<DayOfWeek>();
    for (const item of data.weeklySchedule) {
      if (!VALID_DAYS.includes(item.dayOfWeek)) {
        throw new Error(`Invalid dayOfWeek: ${item.dayOfWeek}`);
      }

      if (validatedDays.has(item.dayOfWeek)) {
        throw new Error(`Duplicate dayOfWeek entry: ${item.dayOfWeek}`);
      }
      validatedDays.add(item.dayOfWeek);

      validateTimeFormat(item.startTime, `${item.dayOfWeek} startTime`);
      validateTimeFormat(item.endTime, `${item.dayOfWeek} endTime`);

      const startMin = timeToMinutes(item.startTime);
      const endMin = timeToMinutes(item.endTime);

      if (startMin >= endMin) {
        throw new Error(
          `For ${item.dayOfWeek}, startTime (${item.startTime}) must be earlier than endTime (${item.endTime}).`
        );
      }

      if (item.breakStart || item.breakEnd) {
        if (!item.breakStart || !item.breakEnd) {
          throw new Error(`For ${item.dayOfWeek}, both breakStart and breakEnd must be provided.`);
        }
        validateTimeFormat(item.breakStart, `${item.dayOfWeek} breakStart`);
        validateTimeFormat(item.breakEnd, `${item.dayOfWeek} breakEnd`);

        const bStartMin = timeToMinutes(item.breakStart);
        const bEndMin = timeToMinutes(item.breakEnd);

        if (bStartMin >= bEndMin) {
          throw new Error(`For ${item.dayOfWeek}, breakStart must be earlier than breakEnd.`);
        }
        if (bStartMin <= startMin || bEndMin >= endMin) {
          throw new Error(`For ${item.dayOfWeek}, break must be within working hours.`);
        }
      }
    }

    // Execute atomic replace in a database transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (typeof data.vacationMode === 'boolean') {
        await tx.serviceProviderProfile.update({
          where: { id: profile.id },
          data: { vacationMode: data.vacationMode },
        });
      }

      // Upsert each day entry
      for (const item of data.weeklySchedule) {
        await tx.providerAvailability.upsert({
          where: {
            providerProfileId_dayOfWeek: {
              providerProfileId: profile.id,
              dayOfWeek: item.dayOfWeek,
            },
          },
          update: {
            startTime: item.startTime,
            endTime: item.endTime,
            breakStart: item.breakStart || null,
            breakEnd: item.breakEnd || null,
            isAvailable: item.isAvailable,
          },
          create: {
            providerProfileId: profile.id,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            breakStart: item.breakStart || null,
            breakEnd: item.breakEnd || null,
            isAvailable: item.isAvailable,
          },
        });
      }
    });

    return this.getProviderAvailability(userId);
  }

  /**
   * Create or update a specific calendar date override.
   */
  static async createOverride(
    userId: string,
    data: CreateOverrideRequest
  ): Promise<ProviderAvailabilitySchedule> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await this.getProfileByUserId(userId);

    if (!data.date || isNaN(Date.parse(data.date))) {
      throw new Error('Valid date in YYYY-MM-DD format is required for override.');
    }

    const targetDate = new Date(`${data.date}T00:00:00.000Z`);

    if (data.isAvailable) {
      if (!data.startTime || !data.endTime) {
        throw new Error('startTime and endTime are required when isAvailable is true.');
      }
      validateTimeFormat(data.startTime, 'override startTime');
      validateTimeFormat(data.endTime, 'override endTime');

      const startMin = timeToMinutes(data.startTime);
      const endMin = timeToMinutes(data.endTime);
      if (startMin >= endMin) {
        throw new Error('Override startTime must be earlier than endTime.');
      }
    }

    await prisma.providerAvailabilityOverride.upsert({
      where: {
        providerProfileId_date: {
          providerProfileId: profile.id,
          date: targetDate,
        },
      },
      update: {
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isAvailable: data.isAvailable,
        reason: data.reason?.trim() || null,
      },
      create: {
        providerProfileId: profile.id,
        date: targetDate,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isAvailable: data.isAvailable,
        reason: data.reason?.trim() || null,
      },
    });

    return this.getProviderAvailability(userId);
  }

  /**
   * Delete an availability override owned by this provider.
   */
  static async deleteOverride(userId: string, overrideId: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await this.getProfileByUserId(userId);

    const override = await prisma.providerAvailabilityOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new Error('Availability override not found.');
    }

    if (override.providerProfileId !== profile.id) {
      throw new Error('Forbidden: You can delete only your own availability overrides.');
    }

    await prisma.providerAvailabilityOverride.delete({
      where: { id: overrideId },
    });
  }

  /**
   * Deterministic Availability Check for a specific provider, date, time, and duration.
   * Usable both by customer discovery and direct booking queries.
   */
  static async checkProviderAvailability(
    providerProfileId: string,
    dateStr: string,
    startTimeStr?: string,
    durationHours: number = 1
  ): Promise<AvailabilityCheckResponse> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!dateStr || isNaN(Date.parse(dateStr))) {
      return {
        providerId: providerProfileId,
        date: dateStr,
        isAvailable: false,
        reason: 'Invalid or missing date parameter.',
      };
    }

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerProfileId },
      include: {
        availabilities: true,
        availabilityOverrides: true,
      },
    });

    if (!profile) {
      return {
        providerId: providerProfileId,
        date: dateStr,
        isAvailable: false,
        reason: 'Provider not found.',
      };
    }

    // 1. Vacation Mode check
    if (profile.vacationMode) {
      return {
        providerId: providerProfileId,
        date: dateStr,
        isAvailable: false,
        reason: 'Provider is currently unavailable (vacation / out-of-office mode).',
      };
    }

    const requestedDate = new Date(`${dateStr}T00:00:00.000Z`);

    // 2. Date Override check
    const override = profile.availabilityOverrides.find((o: ProviderAvailabilityOverride) => {
      const oDateStr = o.date.toISOString().split('T')[0];
      return oDateStr === dateStr;
    });

    if (override) {
      if (!override.isAvailable) {
        return {
          providerId: providerProfileId,
          date: dateStr,
          isAvailable: false,
          reason: override.reason || 'Provider has scheduled this day off.',
        };
      }

      // Override exists and provider is available with custom hours
      if (override.startTime && override.endTime) {
        const oWorkingHours = {
          startTime: override.startTime,
          endTime: override.endTime,
        };

        if (startTimeStr) {
          validateTimeFormat(startTimeStr, 'startTime');
          const reqStartMin = timeToMinutes(startTimeStr);
          const reqEndMin = reqStartMin + durationHours * 60;
          const openMin = timeToMinutes(override.startTime);
          const closeMin = timeToMinutes(override.endTime);

          if (reqStartMin < openMin || reqEndMin > closeMin) {
            return {
              providerId: providerProfileId,
              date: dateStr,
              isAvailable: false,
              reason: `Requested interval (${startTimeStr} - ${Math.floor(reqEndMin / 60)}:${(reqEndMin % 60).toString().padStart(2, '0')}) falls outside special schedule (${override.startTime} - ${override.endTime}).`,
              workingHours: oWorkingHours,
            };
          }
        }

        return {
          providerId: providerProfileId,
          date: dateStr,
          isAvailable: true,
          workingHours: oWorkingHours,
        };
      }
    }

    // 3. Regular Weekly Schedule lookup
    const dayOfWeek = getDayOfWeekFromDate(requestedDate);
    const daySchedule = profile.availabilities.find((a: ProviderAvailability) => a.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isAvailable) {
      return {
        providerId: providerProfileId,
        date: dateStr,
        isAvailable: false,
        reason: `Provider does not offer service on ${dayOfWeek.toLowerCase()}s.`,
      };
    }

    const workingHours = {
      startTime: daySchedule.startTime,
      endTime: daySchedule.endTime,
      breakStart: daySchedule.breakStart,
      breakEnd: daySchedule.breakEnd,
    };

    if (!startTimeStr) {
      // Date-only check: Provider is scheduled to work on this day
      return {
        providerId: providerProfileId,
        date: dateStr,
        isAvailable: true,
        workingHours,
      };
    }

    // Specific time interval check
    validateTimeFormat(startTimeStr, 'startTime');
    const reqStartMin = timeToMinutes(startTimeStr);
    const reqEndMin = reqStartMin + durationHours * 60;
    const shiftStartMin = timeToMinutes(daySchedule.startTime);
    const shiftEndMin = timeToMinutes(daySchedule.endTime);

    if (reqStartMin < shiftStartMin || reqEndMin > shiftEndMin) {
      return {
        providerId: providerProfileId,
        date: dateStr,
        isAvailable: false,
        reason: `Requested service interval falls outside operating hours (${daySchedule.startTime} - ${daySchedule.endTime}).`,
        workingHours,
      };
    }

    // Break time collision check
    if (daySchedule.breakStart && daySchedule.breakEnd) {
      const bStartMin = timeToMinutes(daySchedule.breakStart);
      const bEndMin = timeToMinutes(daySchedule.breakEnd);

      // Overlap condition: max(reqStart, bStart) < min(reqEnd, bEnd)
      if (Math.max(reqStartMin, bStartMin) < Math.min(reqEndMin, bEndMin)) {
        return {
          providerId: providerProfileId,
          date: dateStr,
          isAvailable: false,
          reason: `Requested service interval conflicts with scheduled rest break (${daySchedule.breakStart} - ${daySchedule.breakEnd}).`,
          workingHours,
        };
      }
    }

    return {
      providerId: providerProfileId,
      date: dateStr,
      isAvailable: true,
      workingHours,
    };
  }
}
