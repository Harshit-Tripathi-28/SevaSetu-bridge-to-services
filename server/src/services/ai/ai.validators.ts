import type {
  AiServiceRequestIntent,
  AiReviewSummaryRecord,
  AiSupportResponse,
  AiMatchExplanation,
  DayOfWeek,
} from '@sevasetu/shared';

const VALID_DAYS: Set<DayOfWeek> = new Set([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export function validateServiceRequestIntent(raw: unknown): AiServiceRequestIntent {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Expected object for service request intent.');
  }

  const obj = raw as Record<string, unknown>;

  const intent = typeof obj.intent === 'string' && obj.intent.trim() ? obj.intent.trim() : 'Service Request';

  let urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY' = 'NORMAL';
  if (obj.urgency === 'URGENT' || obj.urgency === 'EMERGENCY') {
    urgency = obj.urgency;
  }

  const categorySlug = typeof obj.categorySlug === 'string' && obj.categorySlug.trim() ? obj.categorySlug.trim().toLowerCase() : null;
  const serviceSlug = typeof obj.serviceSlug === 'string' && obj.serviceSlug.trim() ? obj.serviceSlug.trim().toLowerCase() : null;

  let requestedDate: string | null = null;
  if (typeof obj.requestedDate === 'string' && obj.requestedDate.trim()) {
    requestedDate = obj.requestedDate.trim();
  }

  let preferredStartTime: string | null = null;
  if (typeof obj.preferredStartTime === 'string' && obj.preferredStartTime.trim()) {
    preferredStartTime = obj.preferredStartTime.trim();
  }

  let preferredEndTime: string | null = null;
  if (typeof obj.preferredEndTime === 'string' && obj.preferredEndTime.trim()) {
    preferredEndTime = obj.preferredEndTime.trim();
  }

  let durationHours = 2;
  if (typeof obj.durationHours === 'number' && Number.isFinite(obj.durationHours) && obj.durationHours > 0) {
    durationHours = Math.min(Math.max(1, Math.round(obj.durationHours)), 24);
  }

  let recurrence: 'ONE_OFF' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' = 'ONE_OFF';
  if (
    obj.recurrence === 'DAILY' ||
    obj.recurrence === 'WEEKLY' ||
    obj.recurrence === 'MONTHLY' ||
    obj.recurrence === 'CUSTOM'
  ) {
    recurrence = obj.recurrence;
  }

  const recurrenceDays: DayOfWeek[] = [];
  if (Array.isArray(obj.recurrenceDays)) {
    for (const d of obj.recurrenceDays) {
      if (typeof d === 'string' && VALID_DAYS.has(d.toUpperCase() as DayOfWeek)) {
        recurrenceDays.push(d.toUpperCase() as DayOfWeek);
      }
    }
  }

  let roomCount: number | null = null;
  if (typeof obj.roomCount === 'number' && Number.isFinite(obj.roomCount) && obj.roomCount > 0) {
    roomCount = Math.round(obj.roomCount);
  }

  const taskDescription =
    typeof obj.taskDescription === 'string' && obj.taskDescription.trim()
      ? obj.taskDescription.trim()
      : intent;

  const matchedAddressId =
    typeof obj.matchedAddressId === 'string' && obj.matchedAddressId.trim()
      ? obj.matchedAddressId.trim()
      : null;

  const addressLabelHint =
    typeof obj.addressLabelHint === 'string' && obj.addressLabelHint.trim()
      ? obj.addressLabelHint.trim().toUpperCase()
      : null;

  const preferences: string[] = Array.isArray(obj.preferences)
    ? obj.preferences.filter((p): p is string => typeof p === 'string' && Boolean(p.trim())).map(p => p.trim())
    : [];

  const constraints: string[] = Array.isArray(obj.constraints)
    ? obj.constraints.filter((c): c is string => typeof c === 'string' && Boolean(c.trim())).map(c => c.trim())
    : [];

  const missingFields: string[] = Array.isArray(obj.missingFields)
    ? obj.missingFields.filter((m): m is string => typeof m === 'string' && Boolean(m.trim())).map(m => m.trim().toUpperCase())
    : [];

  let confidence = 0.85;
  if (typeof obj.confidence === 'number' && Number.isFinite(obj.confidence)) {
    confidence = Math.min(1.0, Math.max(0.0, obj.confidence));
  }

  return {
    categorySlug,
    serviceSlug,
    intent,
    urgency,
    requestedDate,
    preferredStartTime,
    preferredEndTime,
    durationHours,
    recurrence,
    recurrenceDays,
    roomCount,
    taskDescription,
    matchedAddressId,
    addressLabelHint,
    preferences,
    constraints,
    missingFields,
    confidence,
  };
}

export function validateReviewSummaryOutput(raw: unknown): Partial<AiReviewSummaryRecord> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Expected object for review summary output.');
  }

  const obj = raw as Record<string, unknown>;

  const summaryText =
    typeof obj.summaryText === 'string' && obj.summaryText.trim()
      ? obj.summaryText.trim()
      : 'Review summary based on verified customer feedback.';

  const rawThemes = obj.positiveThemes || obj.positiveHighlights;
  const positiveThemes: string[] = Array.isArray(rawThemes)
    ? rawThemes.filter((t): t is string => typeof t === 'string' && Boolean(t.trim())).map(t => t.trim())
    : [];

  const areasForImprovement: string[] = Array.isArray(obj.areasForImprovement)
    ? obj.areasForImprovement.filter((a): a is string => typeof a === 'string' && Boolean(a.trim())).map(a => a.trim())
    : [];

  return {
    summaryText,
    positiveThemes,
    areasForImprovement,
  };
}

export function validateSupportResponse(raw: unknown): AiSupportResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Expected object for support response.');
  }

  const obj = raw as Record<string, unknown>;

  const answer =
    typeof obj.answer === 'string' && obj.answer.trim()
      ? obj.answer.trim()
      : 'I am here to help you with your SevaSetu service questions.';

  const suggestedActions: string[] = Array.isArray(obj.suggestedActions)
    ? obj.suggestedActions.filter((a): a is string => typeof a === 'string' && Boolean(a.trim())).map(a => a.trim())
    : [];

  const escalateToHuman = Boolean(obj.escalateToHuman);
  const escalationReason =
    typeof obj.escalationReason === 'string' && obj.escalationReason.trim()
      ? obj.escalationReason.trim()
      : null;

  const relevantHelpTopic =
    typeof obj.relevantHelpTopic === 'string' && obj.relevantHelpTopic.trim()
      ? obj.relevantHelpTopic.trim()
      : null;

  return {
    answer,
    suggestedActions,
    escalateToHuman,
    escalationReason,
    relevantHelpTopic,
  };
}

export function validateProviderRankingOutput(raw: unknown): Array<{
  providerProfileId: string;
  aiScore: number;
  matchExplanation: AiMatchExplanation;
}> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Expected object for provider ranking output.');
  }

  const obj = raw as Record<string, unknown>;
  const list = Array.isArray(obj.rankedProviders) ? obj.rankedProviders : [];

  return list.map((item: unknown) => {
    const itemObj = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
    const providerProfileId = String(itemObj.providerProfileId || '');
    
    const explObj = (itemObj.matchExplanation && typeof itemObj.matchExplanation === 'object')
      ? (itemObj.matchExplanation as Record<string, unknown>)
      : itemObj;

    const rawScore = typeof itemObj.aiScore === 'number'
      ? itemObj.aiScore
      : (typeof itemObj.rankingAssistanceScore === 'number'
        ? itemObj.rankingAssistanceScore
        : (typeof explObj.rankingAssistanceScore === 'number'
          ? explObj.rankingAssistanceScore
          : 75));
    const aiScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    const explanations: string[] = Array.isArray(explObj.explanations)
      ? explObj.explanations.filter((e): e is string => typeof e === 'string' && Boolean(e.trim()))
      : (Array.isArray(itemObj.explanations)
        ? (itemObj.explanations as any[]).filter((e): e is string => typeof e === 'string' && Boolean(e.trim()))
        : ['Matches your service request criteria.']);

    const preferenceAlignment =
      typeof explObj.preferenceAlignment === 'string' && explObj.preferenceAlignment.trim()
        ? explObj.preferenceAlignment.trim()
        : 'Good match for requested requirements.';

    return {
      providerProfileId,
      aiScore,
      matchExplanation: {
        providerProfileId,
        rankingAssistanceScore: aiScore,
        explanations,
        preferenceAlignment,
        verifiedBadgeMatch: Boolean(explObj.verifiedBadgeMatch ?? (explObj.relevanceFactors as any)?.skillMatch),
        experienceMatch: Boolean(explObj.experienceMatch ?? (explObj.relevanceFactors as any)?.experienceMatch),
        availabilityMatch: Boolean(explObj.availabilityMatch ?? (explObj.relevanceFactors as any)?.proximityMatch),
      },
    };
  });
}
