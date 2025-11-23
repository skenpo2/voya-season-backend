// src/app.ts
import express, { Application } from 'express';
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

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());
// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/admin', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
