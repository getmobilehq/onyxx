import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  getAllElements, 
  getElementById, 
  seedElements 
} from '../controllers/elements.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// Get all elements with optional filtering
router.get('/', getAllElements);

// Get specific element by ID
router.get('/:id', getElementById);

// Seed elements (admin only - for initial setup)
router.post('/seed', seedElements);

export default router;