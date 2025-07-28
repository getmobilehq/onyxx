import express from 'express';
import { body } from 'express-validator';
import {
  getPreAssessmentByAssessmentId,
  getPreAssessmentByBuildingId,
  savePreAssessment,
  deletePreAssessment,
  getAllPreAssessments
} from '../controllers/pre-assessments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules for pre-assessment creation/update
const preAssessmentValidation = [
  body('assessment_id')
    .isUUID()
    .withMessage('Assessment ID must be a valid UUID'),
  body('building_id')
    .isUUID()
    .withMessage('Building ID must be a valid UUID'),
  body('assessment_type')
    .notEmpty()
    .withMessage('Assessment type is required')
    .isIn(['Annual', 'Condition', 'Compliance', 'Insurance', 'Due Diligence', 'Capital Planning'])
    .withMessage('Invalid assessment type'),
  body('assessment_date')
    .isISO8601()
    .withMessage('Assessment date must be a valid date'),
  body('assessment_scope')
    .notEmpty()
    .withMessage('Assessment scope is required'),
  body('building_size')
    .isInt({ min: 1 })
    .withMessage('Building size must be a positive integer'),
  body('building_type')
    .optional()
    .isString()
    .withMessage('Building type must be a string'),
  body('replacement_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Replacement value must be a positive number'),
  body('selected_elements')
    .isArray({ min: 1 })
    .withMessage('At least one element must be selected'),
  body('checklist')
    .isObject()
    .withMessage('Checklist must be an object'),
  body('additional_notes')
    .optional()
    .isString()
    .withMessage('Additional notes must be a string'),
  body('assessor_name')
    .optional()
    .isString()
    .withMessage('Assessor name must be a string'),
  body('status')
    .optional()
    .isIn(['draft', 'completed'])
    .withMessage('Status must be either draft or completed')
];

// Routes
router.get('/', getAllPreAssessments);
router.get('/assessment/:assessmentId', getPreAssessmentByAssessmentId);
router.get('/building/:buildingId', getPreAssessmentByBuildingId);
router.post('/', preAssessmentValidation, savePreAssessment);
router.put('/', preAssessmentValidation, savePreAssessment); // Same handler for PUT
router.delete('/:id', deletePreAssessment);

export default router;