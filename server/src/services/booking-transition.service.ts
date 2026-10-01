import type { BookingStatus, BookingActorType } from '@prisma/client';

export interface TransitionRule {
  allowedNextStatuses: BookingStatus[];
  allowedActors: Partial<Record<BookingStatus, BookingActorType[]>>;
}

export const BOOKING_TRANSITION_MAP: Record<BookingStatus, TransitionRule> = {
  PENDING_PROVIDER: {
    allowedNextStatuses: ['ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED'],
    allowedActors: {
      ACCEPTED: ['PROVIDER'],
      DECLINED: ['PROVIDER'],
      CANCELLED: ['CUSTOMER', 'PROVIDER'],
      EXPIRED: ['SYSTEM'],
    },
  },
  ACCEPTED: {
    allowedNextStatuses: ['SCHEDULED', 'CANCELLED'],
    allowedActors: {
      SCHEDULED: ['PROVIDER', 'CUSTOMER', 'SYSTEM'],
      CANCELLED: ['CUSTOMER', 'PROVIDER'],
    },
  },
  SCHEDULED: {
    allowedNextStatuses: ['ON_THE_WAY', 'CANCELLED'],
    allowedActors: {
      ON_THE_WAY: ['PROVIDER'],
      CANCELLED: ['CUSTOMER', 'PROVIDER'],
    },
  },
  ON_THE_WAY: {
    allowedNextStatuses: ['ARRIVED', 'CANCELLED'],
    allowedActors: {
      ARRIVED: ['PROVIDER'],
      CANCELLED: ['CUSTOMER', 'PROVIDER'],
    },
  },
  ARRIVED: {
    allowedNextStatuses: ['IN_PROGRESS', 'CANCELLED'],
    allowedActors: {
      IN_PROGRESS: ['PROVIDER'],
      CANCELLED: ['CUSTOMER', 'PROVIDER'],
    },
  },
  IN_PROGRESS: {
    allowedNextStatuses: ['COMPLETED', 'CANCELLED'],
    allowedActors: {
      COMPLETED: ['PROVIDER'],
      CANCELLED: ['PROVIDER'],
    },
  },
  COMPLETED: {
    allowedNextStatuses: [],
    allowedActors: {},
  },
  CANCELLED: {
    allowedNextStatuses: [],
    allowedActors: {},
  },
  DECLINED: {
    allowedNextStatuses: [],
    allowedActors: {},
  },
  EXPIRED: {
    allowedNextStatuses: [],
    allowedActors: {},
  },
};

export class BookingTransitionError extends Error {
  public code: string;
  public fromStatus: BookingStatus;
  public toStatus: BookingStatus;
  public actorType?: BookingActorType;

  constructor(
    message: string,
    code: string,
    fromStatus: BookingStatus,
    toStatus: BookingStatus,
    actorType?: BookingActorType
  ) {
    super(message);
    this.name = 'BookingTransitionError';
    this.code = code;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
    this.actorType = actorType;
  }
}

export class BookingTransitionService {
  /**
   * Validate whether a status transition is permitted from currentStatus to newStatus for the given actor.
   * Throws BookingTransitionError if invalid.
   */
  static validateTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    actorType: BookingActorType
  ): void {
    if (currentStatus === newStatus) {
      throw new BookingTransitionError(
        `Booking is already in status '${currentStatus}'.`,
        'NO_OP_TRANSITION',
        currentStatus,
        newStatus,
        actorType
      );
    }

    const rule = BOOKING_TRANSITION_MAP[currentStatus];
    if (!rule || !rule.allowedNextStatuses.includes(newStatus)) {
      throw new BookingTransitionError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        'INVALID_STATUS_TRANSITION',
        currentStatus,
        newStatus,
        actorType
      );
    }

    const permittedActors = rule.allowedActors[newStatus] || [];
    if (!permittedActors.includes(actorType)) {
      throw new BookingTransitionError(
        `Actor '${actorType}' is not authorized to transition booking from '${currentStatus}' to '${newStatus}'. Permitted actors: [${permittedActors.join(', ')}]`,
        'UNAUTHORIZED_TRANSITION_ACTOR',
        currentStatus,
        newStatus,
        actorType
      );
    }
  }

  /**
   * Check without throwing whether transition is permitted.
   */
  static canTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    actorType: BookingActorType
  ): boolean {
    try {
      this.validateTransition(currentStatus, newStatus, actorType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List allowed next statuses for a given status and actor.
   */
  static getAllowedNextStatuses(
    currentStatus: BookingStatus,
    actorType: BookingActorType
  ): BookingStatus[] {
    const rule = BOOKING_TRANSITION_MAP[currentStatus];
    if (!rule) return [];
    return rule.allowedNextStatuses.filter((status) => {
      const permitted = rule.allowedActors[status] || [];
      return permitted.includes(actorType);
    });
  }
}
