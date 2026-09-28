import type { Request, Response, NextFunction } from 'express';
import { ProviderService } from '../services/provider.service.js';

export class ProviderController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const profile = await ProviderService.getOrCreateProviderProfile(req.user.id);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const updated = await ProviderService.updateProviderProfile(req.user.id, req.body);
      res.status(200).json({ success: true, message: 'Provider profile updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const skills = await ProviderService.getSkills(req.user.id);
      res.status(200).json({ success: true, data: skills });
    } catch (err) {
      next(err);
    }
  }

  static async addSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const { name, category, experienceLevel } = req.body;
      if (!name || !category) {
        res.status(400).json({ success: false, error: 'Validation Error', message: 'name and category are required' });
        return;
      }

      const skill = await ProviderService.addSkill(req.user.id, { name, category, experienceLevel });
      res.status(201).json({ success: true, message: 'Skill added successfully', data: skill });
    } catch (err) {
      next(err);
    }
  }

  static async removeSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id || '');
      await ProviderService.removeSkill(req.user.id, id);
      res.status(200).json({ success: true, message: 'Skill removed successfully' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        res.status(403).json({ success: false, error: 'Forbidden', message: err.message });
        return;
      }
      next(err);
    }
  }

  static async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const services = await ProviderService.getServices(req.user.id);
      res.status(200).json({ success: true, data: services });
    } catch (err) {
      next(err);
    }
  }

  static async addService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const { serviceId, customTitle, description, pricingModel, customPrice, minDuration, isActive } = req.body;
      if (!serviceId) {
        res.status(400).json({ success: false, error: 'Validation Error', message: 'serviceId is required' });
        return;
      }

      const record = await ProviderService.addService(req.user.id, {
        serviceId,
        customTitle,
        description,
        pricingModel,
        customPrice,
        minDuration,
        isActive,
      });

      res.status(201).json({ success: true, message: 'Service added to offerings', data: record });
    } catch (err) {
      next(err);
    }
  }

  static async updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id || '');
      const updated = await ProviderService.updateService(req.user.id, id, req.body);
      res.status(200).json({ success: true, message: 'Provider service updated', data: updated });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        res.status(403).json({ success: false, error: 'Forbidden', message: err.message });
        return;
      }
      next(err);
    }
  }

  static async removeService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id || '');
      await ProviderService.removeService(req.user.id, id);
      res.status(200).json({ success: true, message: 'Service removed from offerings' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        res.status(403).json({ success: false, error: 'Forbidden', message: err.message });
        return;
      }
      next(err);
    }
  }

  static async getServiceAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const areas = await ProviderService.getServiceAreas(req.user.id);
      res.status(200).json({ success: true, data: areas });
    } catch (err) {
      next(err);
    }
  }

  static async setServiceArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const { city, locality, state, postalCode, radiusKm } = req.body;
      if (!city || !locality || !postalCode) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'city, locality, and postalCode are required',
        });
        return;
      }

      const area = await ProviderService.setServiceArea(req.user.id, {
        city,
        locality,
        state,
        postalCode,
        radiusKm,
      });

      res.status(200).json({ success: true, message: 'Service area configured successfully', data: area });
    } catch (err) {
      next(err);
    }
  }

  static async getOnboardingState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const state = await ProviderService.getOnboardingState(req.user.id);
      res.status(200).json({ success: true, data: state });
    } catch (err) {
      next(err);
    }
  }

  static async completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const state = await ProviderService.completeOnboarding(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Congratulations! Provider onboarding completed successfully.',
        data: state,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Cannot complete onboarding')) {
        res.status(400).json({ success: false, error: 'Incomplete Onboarding', message: err.message });
        return;
      }
      next(err);
    }
  }

  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id || '');
      const profile = await ProviderService.getPublicProviderProfile(id);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Provider profile not found or not currently available.',
        });
        return;
      }

      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
}
