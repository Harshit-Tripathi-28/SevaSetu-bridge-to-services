import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller.js';

const router = Router();

// Public Service Catalog Endpoints
router.get('/service-categories', CatalogController.getCategories);
router.get('/service-categories/:id', CatalogController.getCategoryBySlugOrId);
router.get('/service-categories/:categoryId/services', CatalogController.getServicesByCategory);

router.get('/services', CatalogController.getServices);
router.get('/services/:id', CatalogController.getServiceById);

export default router;
