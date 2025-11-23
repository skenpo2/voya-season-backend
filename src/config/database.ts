import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD!
        : process.env.MONGODB_URI!;

    await mongoose.connect(mongoURI);

    logger.info(' MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error(' MongoDB connection failed:', error);
    process.exit(1);
  }
};
