import { Router } from 'express';
import {
  verifyPayment,
  getPayments,
  updatePaymentStatus,
  verifyPaymentCallback,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';
import { handlePaystackWebhook } from '@/controllers/webhook.controller';

const router = Router();

// Add this route
router.get('/verify', verifyPaymentCallback);

// Admin routes
router.get('/', protect, getPayments);
router.patch('/:id/status', protect, updatePaymentStatus);

export default router;
