import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  inviteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'assessor'])
    .withMessage('Invalid role'),
];

const inviteUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .isIn(['admin', 'manager', 'assessor'])
    .withMessage('Invalid role'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
];

// Routes
router.get('/', authorize('admin', 'manager'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.post('/invite', authorize('admin', 'manager'), inviteUserValidation, inviteUser);

export default router;