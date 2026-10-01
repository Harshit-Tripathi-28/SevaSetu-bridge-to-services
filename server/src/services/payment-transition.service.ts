import type { PaymentStatus, BookingActorType } from '@sevasetu/shared';
import { ALLOWED_PAYMENT_TRANSITIONS } from '@sevasetu/shared';

export class InvalidPaymentTransitionError extends Error {
  constructor(current: PaymentStatus, target: PaymentStatus, reason?: string) {
    super(
      `Invalid payment status transition from '${current}' to '${target}'.${
        reason ? ` Reason: ${reason}` : ''
      }`
    );
    this.name = 'InvalidPaymentTransitionError';
  }
}

export class PaymentAuthorizationError extends Error {
  constructor(message = 'Unauthorized to modify or view this payment record.') {
    super(message);
    this.name = 'PaymentAuthorizationError';
  }
}

export class PaymentTransitionService {
  /**
   * Validates whether a payment status transition is permitted by the state machine.
   */
  static validateTransition(
    currentStatus: PaymentStatus,
    targetStatus: PaymentStatus,
    actorType: BookingActorType | 'ADMIN'
  ): void {
    if (currentStatus === targetStatus) {
      return;
    }

    const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new InvalidPaymentTransitionError(
        currentStatus,
        targetStatus,
        `Allowed transitions from '${currentStatus}' are: [${allowed.join(', ')}]`
      );
    }

    // Role-specific transition rules
    if (targetStatus === 'CANCELLED' && actorType !== 'CUSTOMER' && (actorType as string) !== 'ADMIN' && actorType !== 'SYSTEM') {
      throw new PaymentAuthorizationError('Only the customer, admin or system can cancel a payment.');
    }

    if ((targetStatus === 'REFUND_PENDING' || targetStatus === 'PARTIALLY_REFUNDED' || targetStatus === 'REFUNDED') &&
        actorType !== 'CUSTOMER' && (actorType as string) !== 'ADMIN' && actorType !== 'SYSTEM') {
      throw new PaymentAuthorizationError('Only authorized participants can initiate or process refunds.');
    }
  }

  static getPermittedNextStatuses(currentStatus: PaymentStatus): PaymentStatus[] {
    return ALLOWED_PAYMENT_TRANSITIONS[currentStatus] || [];
  }
}
