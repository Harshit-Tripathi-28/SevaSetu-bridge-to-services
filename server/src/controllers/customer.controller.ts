import type { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service.js';

export class CustomerController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const profile = await CustomerService.getProfile(req.user.id);
      if (!profile) {
        res.status(404).json({ success: false, error: 'Not Found', message: 'Profile not found' });
        return;
      }

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

      const { fullName, phone } = req.body;
      const updated = await CustomerService.updateProfile(req.user.id, { fullName, phone });
      res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const addresses = await CustomerService.getAddresses(req.user.id);
      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  }

  static async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const { label, flatNumber, streetArea, city, state, postalCode, landmark, isDefault } = req.body;

      if (!flatNumber || !streetArea || !city || !postalCode) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'flatNumber, streetArea, city, and postalCode are required fields.',
        });
        return;
      }

      const created = await CustomerService.createAddress(req.user.id, {
        label: label || 'HOME',
        flatNumber,
        streetArea,
        city,
        state,
        postalCode,
        landmark,
        isDefault,
      });

      res.status(201).json({ success: true, message: 'Address created successfully', data: created });
    } catch (err) {
      next(err);
    }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id || '');
      const { label, flatNumber, streetArea, city, state, postalCode, landmark, isDefault } = req.body;

      const updated = await CustomerService.updateAddress(req.user.id, id, {
        label,
        flatNumber,
        streetArea,
        city,
        state,
        postalCode,
        landmark,
        isDefault,
      });

      res.status(200).json({ success: true, message: 'Address updated successfully', data: updated });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        res.status(403).json({ success: false, error: 'Forbidden', message: err.message });
        return;
      }
      next(err);
    }
  }

  static async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id || '');
      const updated = await CustomerService.setDefaultAddress(req.user.id, id);
      res.status(200).json({ success: true, message: 'Primary address updated', data: updated });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        res.status(403).json({ success: false, error: 'Forbidden', message: err.message });
        return;
      }
      next(err);
    }
  }

  static async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id || '');
      await CustomerService.deleteAddress(req.user.id, id);
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        res.status(403).json({ success: false, error: 'Forbidden', message: err.message });
        return;
      }
      next(err);
    }
  }
}
