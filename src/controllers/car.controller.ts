import { Response, NextFunction } from 'express';
import { Car } from '../models/Car.model';
import { CloudinaryService } from '../services/cloudainary.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS, ITEMS_PER_PAGE } from '../config/constants';
import { AuthRequest, PaginationQuery } from '../types';

/**
 * @route   GET /api/cars
 * @desc    Get all cars with pagination
 * @access  Public
 */
export const getCars = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = '1', limit = '12', type } = req.query as PaginationQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (type && type !== 'all') {
      query.type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }

    // Get cars with pagination
    const [cars, totalItems] = await Promise.all([
      Car.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Car.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Cars retrieved successfully', cars, {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      })
    );
  }
);

/**
 * @route   GET /api/cars/:id
 * @desc    Get single car
 * @access  Public
 */
export const getCar = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const car = await Car.findById(req.params.id);

    if (!car) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Car not found');
    }

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Car retrieved successfully', car));
  }
);

/**
 * @route   GET /api/cars/featured
 * @desc    Get featured/random car
 * @access  Public
 */
export const getFeaturedCar = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Get random car
    const count = await Car.countDocuments({ available: true });
    const random = Math.floor(Math.random() * count);
    const car = await Car.findOne({ available: true }).skip(random);

    if (!car) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No cars available');
    }

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Featured car retrieved successfully', car));
  }
);

/**
 * @route   POST /api/admin/cars
 * @desc    Create new car
 * @access  Private/Admin
 */
export const createCar = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      name,
      price,
      type,
      seats,
      fuel,
      year,
      transmission,
      duration,
      status,
      amenities,
    } = req.body;

    // Check if images uploaded
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'At least one image is required'
      );
    }

    const files = req.files as Express.Multer.File[];

    // Upload images to Cloudinary
    const imageUrls = await CloudinaryService.uploadMultipleImages(files);

    // Parse amenities if it's a string
    let parsedAmenities = [];
    if (amenities) {
      parsedAmenities = Array.isArray(amenities)
        ? amenities
        : JSON.parse(amenities);
    }

    // Create car
    const car = await Car.create({
      name,
      price: parseInt(price),
      type,
      images: imageUrls,
      features: {
        seats: parseInt(seats),
        fuel,
        duration: duration || '12 hours',
        year: parseInt(year),
        transmission: transmission || 'Auto',
      },
      available: status === 'available',
      status: status || 'available',
      amenities: parsedAmenities.filter((a: string) => a.trim() !== ''),
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(ApiResponse.success('Car created successfully', car));
  }
);

/**
 * @route   PUT /api/admin/cars/:id
 * @desc    Update car
 * @access  Private/Admin
 */
export const updateCar = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const car = await Car.findById(req.params.id);

    if (!car) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Car not found');
    }

    const {
      name,
      price,
      type,
      seats,
      fuel,
      year,
      transmission,
      duration,
      status,
      amenities,
    } = req.body;

    // Handle image updates if new images uploaded
    let imageUrls = car.images;
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];

      // Delete old images from Cloudinary
      await CloudinaryService.deleteMultipleImages(car.images);

      // Upload new images
      imageUrls = await CloudinaryService.uploadMultipleImages(files);
    }

    // Parse amenities if provided
    let parsedAmenities = car.amenities;
    if (amenities) {
      parsedAmenities = Array.isArray(amenities)
        ? amenities
        : JSON.parse(amenities);
    }

    // Update car
    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      {
        name: name || car.name,
        price: price ? parseInt(price) : car.price,
        type: type || car.type,
        images: imageUrls,
        features: {
          seats: seats ? parseInt(seats) : car.features.seats,
          fuel: fuel || car.features.fuel,
          duration: duration || car.features.duration,
          year: year ? parseInt(year) : car.features.year,
          transmission: transmission || car.features.transmission,
        },
        available: status ? status === 'available' : car.available,
        status: status || car.status,
        amenities: parsedAmenities,
      },
      { new: true, runValidators: true }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Car updated successfully', updatedCar));
  }
);

/**
 * @route   DELETE /api/admin/cars/:id
 * @desc    Delete car
 * @access  Private/Admin
 */
export const deleteCar = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const car = await Car.findById(req.params.id);

    if (!car) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Car not found');
    }

    // Delete images from Cloudinary
    await CloudinaryService.deleteMultipleImages(car.images);

    // Delete car
    await Car.findByIdAndDelete(req.params.id);

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Car deleted successfully', null));
  }
);
