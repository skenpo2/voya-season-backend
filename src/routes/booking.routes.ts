import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getBookings,
  getBookingDetail,
  updateBookingStatus,
  deleteBooking,
} from '../controllers/booking.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Booking validation
const bookingValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('whatsapp').notEmpty().withMessage('Phone number is required'),
  body('pickup').trim().notEmpty().withMessage('Pickup location is required'),
  body('carId').isMongoId().withMessage('Valid car ID is required'),
  body('dates').isArray({ min: 1, max: 7 }).withMessage('1-7 dates required'),
  body('paymentMethod')
    .isIn(['stripe', 'paystack'])
    .withMessage('Invalid payment method'),
];

// Public routes
router.post('/', bookingValidation, validate, createBooking);

// Admin routes
router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingDetail);
router.patch('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);

export default router;
