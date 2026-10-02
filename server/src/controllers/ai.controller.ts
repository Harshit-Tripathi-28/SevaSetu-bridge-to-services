import type { Request, Response } from 'express';
import { aiService } from '../services/ai/ai.service.js';
import { AIServiceError } from '../services/ai/ai.errors.js';
import { getPrismaClient } from '../config/database.js';
import type {
  ApiResponse,
  ParseServiceRequestResponse,
  AiServiceRequestIntent,
  RankProvidersResponse,
  AiReviewSummaryRecord,
  AiSupportResponse,
  AiHealthStatus,
  AiTelemetrySummary,
  AiRepeatServiceRecommendation,
  AiPredictiveReminder,
} from '@sevasetu/shared';

function handleAiError(res: Response, err: unknown) {
  if (err instanceof AIServiceError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  const message = err instanceof Error ? err.message : 'Internal AI service error.';
  return res.status(500).json({
    success: false,
    error: {
      code: 'AI_PROVIDER_ERROR',
      message,
    },
  });
}

export class AIController {
  /**
   * POST /api/ai/service-request/parse
   */
  public async parseServiceRequest(req: Request, res: Response<ApiResponse<ParseServiceRequestResponse>>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
      }

      const { text, prompt, context } = req.body as {
        text?: string;
        prompt?: string;
        context?: { currentDate?: string; preferredCity?: string };
      };
      const rawText = (text || prompt || '').trim();
      if (!rawText) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "text" or "prompt" is required.' },
        });
      }

      const result = await aiService.parseServiceRequest(userId, { text: rawText, context });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * POST /api/ai/service-request/confirm
   */
  public async confirmServiceRequest(req: Request, res: Response<ApiResponse<{ confirmed: boolean; isConfirmed: boolean; intent: AiServiceRequestIntent }>>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
      }

      const { interpretationId, finalIntent, confirmedValues, addressId } = req.body as {
        interpretationId?: string;
        finalIntent?: AiServiceRequestIntent;
        confirmedValues?: any;
        addressId?: string;
      };
      const intentToConfirm = (finalIntent || confirmedValues) as AiServiceRequestIntent;
      if (!intentToConfirm) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "finalIntent" or "confirmedValues" is required.' },
        });
      }

      const effectiveAddressId = addressId || intentToConfirm.matchedAddressId;
      if (effectiveAddressId) {
        const prisma = getPrismaClient();
        const userAddr = await prisma?.address.findFirst({
          where: { id: effectiveAddressId, userId },
        });
        if (!userAddr) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Address does not belong to customer.' },
          });
        }
      }

      const result = await aiService.confirmServiceRequest(userId, {
        interpretationId,
        finalIntent: intentToConfirm,
      });
      return res.status(200).json({
        success: true,
        data: {
          ...result,
          isConfirmed: result.confirmed,
        },
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * POST /api/ai/matching/rank
   */
  public async rankProviders(req: Request, res: Response<ApiResponse<RankProvidersResponse>>) {
    try {
      const { intent, context, providerIds, providerProfileIds } = req.body as {
        intent?: Partial<AiServiceRequestIntent>;
        context?: Partial<AiServiceRequestIntent>;
        providerIds?: string[];
        providerProfileIds?: string[];
      };
      const ids = providerIds || providerProfileIds;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "providerIds" must be a non-empty array.' },
        });
      }

      const result = await aiService.rankProviders({ intent: intent || context || {}, providerIds: ids });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/reviews/:providerProfileId/summary
   */
  public async getReviewSummary(req: Request, res: Response<ApiResponse<AiReviewSummaryRecord & { insufficientData: boolean; message: string; positiveHighlights?: string[] }>>) {
    try {
      const paramId = req.params.providerProfileId;
      const providerProfileId = Array.isArray(paramId) ? paramId[0] : paramId;
      if (!providerProfileId || typeof providerProfileId !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'providerProfileId is required.' },
        });
      }

      const result = await aiService.summarizeReviews(providerProfileId);
      return res.status(200).json({
        success: true,
        data: {
          ...result,
          positiveHighlights: result.positiveThemes,
          insufficientData: !result.isSufficientData,
          message: result.summaryText,
        },
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * POST /api/ai/support/ask
   */
  public async askSupportAssistant(req: Request, res: Response<ApiResponse<AiSupportResponse>>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
      }

      const { question, bookingId } = req.body as { question?: string; bookingId?: string };
      if (!question || typeof question !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "question" is required.' },
        });
      }

      const result = await aiService.handleSupportQuestion(userId, { question, bookingId });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/signals/pricing-anomaly
   */
  public async checkPricingAnomaly(req: Request, res: Response) {
    try {
      const bookingId = req.query.bookingId as string;
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'query param bookingId is required.' },
        });
      }

      const result = await aiService.checkPriceAnomaly(bookingId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/signals/duplicate-profiles
   */
  public async detectDuplicateProfiles(_req: Request, res: Response) {
    try {
      const count = await aiService.detectDuplicateProfiles();
      return res.status(200).json({
        success: true,
        data: { duplicateProfilesFlagged: count },
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/forecast/demand
   */
  public async forecastDemand(req: Request, res: Response) {
    try {
      const categorySlug = (req.query.categorySlug as string) || 'cleaning';
      const city = (req.query.city as string) || 'Bangalore';

      const result = await aiService.forecastDemand(categorySlug, city);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/recommendations/repeat-services
   */
  public async getRepeatServices(req: Request, res: Response<ApiResponse<AiRepeatServiceRecommendation[]>>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
      }

      const result = await aiService.getRepeatServiceRecommendations(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/recommendations/predictive-reminders
   */
  public async getPredictiveReminders(req: Request, res: Response<ApiResponse<AiPredictiveReminder[]>>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
      }

      const result = await aiService.getPredictiveReminders(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/ai/health
   */
  public async getHealth(_req: Request, res: Response<ApiResponse<AiHealthStatus>>) {
    try {
      const health = await aiService.getHealth();
      return res.status(200).json({
        success: true,
        data: health,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/admin/ai/telemetry
   */
  public async getTelemetry(_req: Request, res: Response<ApiResponse<AiTelemetrySummary>>) {
    try {
      const telemetry = await aiService.getTelemetry();
      return res.status(200).json({
        success: true,
        data: telemetry,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * GET /api/admin/ai/settings
   */
  public async getAiSettings(_req: Request, res: Response) {
    try {
      const prisma = getPrismaClient();
      if (!prisma) {
        return res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: 'Database offline.' } });
      }

      const settings = await prisma.platformSetting.findMany({
        where: { category: 'AI' },
      });

      return res.status(200).json({
        success: true,
        data: {
          settings,
          activeProvider: aiService.getProvider().id,
          isConfigured: aiService.isConfigured(),
        },
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }

  /**
   * PATCH /api/admin/ai/settings
   */
  public async updateAiSetting(req: Request, res: Response) {
    try {
      const prisma = getPrismaClient();
      if (!prisma) {
        return res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: 'Database offline.' } });
      }

      const { key, value, description } = req.body as { key: string; value: unknown; description?: string };
      if (!key) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'key is required.' } });
      }

      const updated = await prisma.platformSetting.upsert({
        where: { key },
        create: {
          key,
          value: value as object,
          description: description || 'AI Platform Setting',
          category: 'AI',
          updatedByAdminId: req.user?.id,
        },
        update: {
          value: value as object,
          description: description || undefined,
          updatedByAdminId: req.user?.id,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      return handleAiError(res, err);
    }
  }
}

export const aiController = new AIController();
