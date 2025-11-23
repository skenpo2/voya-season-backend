import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

// Load environment variables

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION!  Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info(' SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info(' Process terminated!');
  });
});
