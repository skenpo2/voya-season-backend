import { Router } from 'express';
import { body } from 'express-validator';
import {
  login,
  getCurrentAdmin,
  register,
} from '../controllers/auth.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Invalid role'),
];

// Routes
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/me', protect, getCurrentAdmin);
router.post(
  '/register',
  protect,
  restrictTo('super_admin'),
  registerValidation,
  validate,
  register
);

export default router;
