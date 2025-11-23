import { Router } from 'express';
import carRoutes from './car.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import discountRoutes from './discount.routes';

const router = Router();

// Admin routes with /admin prefix
router.use('/cars', carRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/discounts', discountRoutes);

export default router;
