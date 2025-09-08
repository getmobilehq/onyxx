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
  saveAssessmentElements,
  calculateFCI,
  completeAssessment,
  generateAssessmentReport
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
router.post('/:id/elements', saveAssessmentElements);

// FCI calculations
router.get('/:id/calculate-fci', calculateFCI);
router.post('/:id/complete', completeAssessment);

// Report generation
router.post('/:id/generate-report', generateAssessmentReport);

export default router;