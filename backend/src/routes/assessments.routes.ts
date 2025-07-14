import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  getAssessmentElements,
  updateAssessmentElement,
  calculateFCI,
  completeAssessment
} from '../controllers/assessments.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// Assessment CRUD operations
router.post('/', createAssessment);
router.get('/', getAllAssessments);
router.get('/:id', getAssessmentById);
router.put('/:id', updateAssessment);
router.delete('/:id', deleteAssessment);

// Assessment elements
router.get('/:id/elements', getAssessmentElements);
router.put('/:assessmentId/elements/:elementId', updateAssessmentElement);

// FCI calculations
router.get('/:id/calculate-fci', calculateFCI);
router.post('/:id/complete', completeAssessment);

export default router;