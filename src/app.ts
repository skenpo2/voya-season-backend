// src/app.ts
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import carRoutes from './routes/car.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import discountRoutes from './routes/discount.routes';
import adminRoutes from './routes/admin.routes';
import { handlePaystackWebhook } from './controllers/webhook.controller';
import { logger } from './utils/logger';

const app: Application = express();

// ============================================================
// 1. GLOBAL PRE-MIDDLEWARE (Security & Logging)
// ============================================================
// Move these to the top so the Webhook also gets security headers and logging
app.use(helmet());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// 2. WEBHOOK ROUTE (Specific Logic)
// ============================================================
// MUST remain here: Before express.json()
app.post(
  '/api/paystack/webhook',
  express.raw({ type: 'application/json' }), // Parses body as Buffer
  async (req: Request, res: Response, next: NextFunction) => {
    // Optional: Log here if you want specific info before the controller
    // logger.info(`Webhook Hit: ${req.method} ${req.url}`);
    next();
  },
  handlePaystackWebhook
);

// ============================================================
// 3. STANDARD MIDDLEWARE (For the rest of the API)
// ============================================================
// Parses JSON for everything else (Auth, Cars, etc.)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (Applied to rest of API, excludes Webhook above)
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 4. API ROUTES
// ============================================================
app.use('/api/admin', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// 5. ERROR HANDLING
// ============================================================
app.use(notFound);
app.use(errorHandler);

export default app;
