import type { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalog.service.js';

export class CatalogController {
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CatalogService.getCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  static async getCategoryBySlugOrId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id || '');
      const category = await CatalogService.getCategoryBySlugOrId(id);
      if (!category) {
        res.status(404).json({ success: false, error: 'Not Found', message: 'Category not found' });
        return;
      }
      res.status(200).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  static async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, categorySlug } = req.query;
      const services = await CatalogService.getServices({
        categoryId: categoryId ? String(categoryId) : undefined,
        categorySlug: categorySlug ? String(categorySlug) : undefined,
      });
      res.status(200).json({ success: true, data: services });
    } catch (err) {
      next(err);
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id || '');
      const service = await CatalogService.getServiceById(id);
      if (!service) {
        res.status(404).json({ success: false, error: 'Not Found', message: 'Service not found' });
        return;
      }
      res.status(200).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  }

  static async getServicesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = String(req.params.categoryId || '');
      const services = await CatalogService.getServicesByCategory(categoryId);
      res.status(200).json({ success: true, data: services });
    } catch (err) {
      next(err);
    }
  }
}
