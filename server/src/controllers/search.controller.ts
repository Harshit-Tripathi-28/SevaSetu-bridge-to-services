import { Request, Response } from 'express';
import { SearchService } from '../services/search.service.js';
import { AvailabilityService } from '../services/availability.service.js';
import type { ApiResponse, ProviderSearchQuery } from '@sevasetu/shared';

export class SearchController {
  /**
   * GET /api/providers/search
   * Public discovery endpoint for searching eligible, verified providers.
   */
  static async searchProviders(req: Request, res: Response): Promise<void> {
    try {
      const query: ProviderSearchQuery = {
        keyword: typeof req.query.keyword === 'string' ? req.query.keyword : undefined,
        serviceId: typeof req.query.serviceId === 'string' ? req.query.serviceId : undefined,
        categorySlug: typeof req.query.categorySlug === 'string' ? req.query.categorySlug : undefined,
        categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
        city: typeof req.query.city === 'string' ? req.query.city : undefined,
        locality: typeof req.query.locality === 'string' ? req.query.locality : undefined,
        postalCode: typeof req.query.postalCode === 'string' ? req.query.postalCode : undefined,
        date: typeof req.query.date === 'string' ? req.query.date : undefined,
        startTime: typeof req.query.startTime === 'string' ? req.query.startTime : undefined,
        durationHours: req.query.durationHours ? Number(req.query.durationHours) : undefined,
        sortBy: req.query.sortBy === 'experience' || req.query.sortBy === 'recommended' ? req.query.sortBy : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await SearchService.searchProviders(query);
      const response: ApiResponse = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed';
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * GET /api/providers/:id/availability
   * Public check for a specific provider's schedule on a given date.
   */
  static async checkProviderAvailability(req: Request, res: Response): Promise<void> {
    try {
      const providerProfileId = String(req.params.id || '');
      const dateStr = typeof req.query.date === 'string' ? req.query.date : '';
      const startTimeStr = typeof req.query.startTime === 'string' ? req.query.startTime : undefined;
      const durationHours = req.query.durationHours ? Number(req.query.durationHours) : 1;

      if (!dateStr) {
        res.status(400).json({
          success: false,
          message: 'Query parameter "date" (YYYY-MM-DD) is required.',
        });
        return;
      }

      const result = await AvailabilityService.checkProviderAvailability(
        providerProfileId,
        dateStr,
        startTimeStr,
        durationHours
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Availability query failed';
      res.status(400).json({ success: false, message });
    }
  }
}
