import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availability.service.js';
import type { ApiResponse } from '@sevasetu/shared';

export class AvailabilityController {
  static async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const schedule = await AvailabilityService.getProviderAvailability(userId);
      const response: ApiResponse = {
        success: true,
        data: schedule,
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve availability';
      res.status(400).json({ success: false, message });
    }
  }

  static async setAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const schedule = await AvailabilityService.setWeeklyAvailability(userId, req.body);
      const response: ApiResponse = {
        success: true,
        message: 'Availability schedule updated successfully',
        data: schedule,
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update availability';
      res.status(400).json({ success: false, message });
    }
  }

  static async createOverride(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const schedule = await AvailabilityService.createOverride(userId, req.body);
      const response: ApiResponse = {
        success: true,
        message: 'Date override saved successfully',
        data: schedule,
      };
      res.status(201).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save date override';
      res.status(400).json({ success: false, message });
    }
  }

  static async deleteOverride(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const overrideId = String(req.params.id || '');
      await AvailabilityService.deleteOverride(userId, overrideId);

      const response: ApiResponse = {
        success: true,
        message: 'Availability override removed',
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete override';
      const status = message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ success: false, message });
    }
  }
}
