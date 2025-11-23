import { Router } from 'express';
import { body } from 'express-validator';
import {
  verifyDiscount,
  createDiscount,
  getDiscounts,
  updateDiscount,
  deleteDiscount,
} from '../controllers/discount.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Discount verification validation
const verifyValidation = [
  body('code').trim().notEmpty().withMessage('Discount code is required'),
  body('carId').isMongoId().withMessage('Valid car ID is required'),
  body('dates').isArray({ min: 1 }).withMessage('Dates are required'),
  body('totalAmount').isNumeric().withMessage('Total amount is required'),
];

// Discount creation validation
const discountValidation = [
  body('code').trim().notEmpty().withMessage('Discount code is required'),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Invalid discount type'),
  body('discountValue')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be positive'),
  body('validFrom').isISO8601().withMessage('Valid start date is required'),
  body('validUntil').isISO8601().withMessage('Valid end date is required'),
];

// Public routes
router.post('/verify', verifyValidation, validate, verifyDiscount);

// Admin routes
router.post('/', protect, discountValidation, validate, createDiscount);
router.get('/', protect, getDiscounts);
router.patch('/:id', protect, updateDiscount);
router.delete('/:id', protect, deleteDiscount);

export default router;
