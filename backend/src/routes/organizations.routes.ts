import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requirePlatformAdmin, requireOrganizationOwner } from '../middleware/auth.middleware';
import {
  getAllOrganizations,
  getOrganizationById,
  getCurrentOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  joinOrganization,
  leaveOrganization
} from '../controllers/organizations.controller';

const router = Router();

// Validation rules
const createOrganizationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 2 })
    .withMessage('Organization name must be at least 2 characters'),
];

// All routes require authentication
router.use(authenticate);

// Get current user's organization
router.get('/current', getCurrentOrganization);

// Get all organizations (admin only)
router.get('/', getAllOrganizations);

// Get organization by ID
router.get('/:id', getOrganizationById);

// Create new organization
router.post('/', createOrganizationValidation, createOrganization);

// Join organization
router.post('/join', body('organizationId').notEmpty().withMessage('Organization ID is required'), joinOrganization);

// Leave organization
router.post('/leave', leaveOrganization);

// Update organization (organization owner or platform admin)
router.put('/:id', requireOrganizationOwner, updateOrganization);

// Delete organization (platform admin only)
router.delete('/:id', requirePlatformAdmin, deleteOrganization);

export default router;