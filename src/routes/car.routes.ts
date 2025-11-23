import { Router } from 'express';
import {
  getCars,
  getCar,
  getFeaturedCar,
  createCar,
  updateCar,
  deleteCar,
} from '../controllers/car.controller';
import { protect } from '../middleware/auth.middleware';
import { uploadCarImages } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', getCars);
router.get('/featured', getFeaturedCar);
router.get('/:id', getCar);

// Admin routes
router.post('/', protect, uploadCarImages, createCar);
router.put('/:id', protect, uploadCarImages, updateCar);
router.delete('/:id', protect, deleteCar);

export default router;
