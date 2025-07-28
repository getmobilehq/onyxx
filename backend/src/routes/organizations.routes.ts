import { Router } from 'express';
import { organizationsController } from '../controllers/organizations.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's organization
router.get('/current', organizationsController.getCurrent);

// Get all organizations (admin only)
router.get('/', organizationsController.getAll);

// Get organization by ID
router.get('/:id', organizationsController.getById);

// Create new organization (admin only)
router.post('/', organizationsController.create);

// Update organization
router.put('/:id', organizationsController.update);

// Delete organization (admin only)
router.delete('/:id', organizationsController.delete);

export default router;