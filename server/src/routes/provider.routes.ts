import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public Provider Profile endpoint
router.get('/providers/:id', ProviderController.getPublicProfile);

// Authenticated Provider-Only Management Endpoints
const providerAuth = [requireAuth, requireRole('PROVIDER', 'ADMIN')];

// Provider Profile
router.get('/provider/profile', providerAuth, ProviderController.getProfile);
router.patch('/provider/profile', providerAuth, ProviderController.updateProfile);

// Provider Skills
router.get('/provider/skills', providerAuth, ProviderController.getSkills);
router.post('/provider/skills', providerAuth, ProviderController.addSkill);
router.delete('/provider/skills/:id', providerAuth, ProviderController.removeSkill);

// Provider Services
router.get('/provider/services', providerAuth, ProviderController.getServices);
router.post('/provider/services', providerAuth, ProviderController.addService);
router.patch('/provider/services/:id', providerAuth, ProviderController.updateService);
router.delete('/provider/services/:id', providerAuth, ProviderController.removeService);

// Provider Service Area
router.get('/provider/service-area', providerAuth, ProviderController.getServiceAreas);
router.put('/provider/service-area', providerAuth, ProviderController.setServiceArea);
router.post('/provider/service-area', providerAuth, ProviderController.setServiceArea);

// Provider Onboarding Workflow
router.get('/provider/onboarding', providerAuth, ProviderController.getOnboardingState);
router.post('/provider/onboarding/complete', providerAuth, ProviderController.completeOnboarding);

export default router;
