import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from '../controllers/buildings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const buildingValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Building name is required')
    .isLength({ min: 2 })
    .withMessage('Building name must be at least 2 characters'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Building type is required'),
  body('year_built')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() + 5 })
    .withMessage('Year built must be a valid year'),
  body('square_footage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Square footage must be a positive number'),
  body('street_address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be 50 characters or less'),
  body('zip_code')
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Zip code must be in format 12345 or 12345-6789'),
  body('cost_per_sqft')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per sqft must be a positive number'),
];

// Routes
router.get('/', getAllBuildings);
router.get('/:id', getBuildingById);
router.post('/', authorize('admin', 'manager'), buildingValidation, createBuilding);
router.put('/:id', authorize('admin', 'manager'), updateBuilding);
router.delete('/:id', authorize('admin'), deleteBuilding);

export default router;