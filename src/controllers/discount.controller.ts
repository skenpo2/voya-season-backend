import { Response, NextFunction } from 'express';
import { Discount } from '../models/Discount.model';
import { Car } from '../models/Car.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../config/constants';
import { AuthRequest } from '../types';

/**
 * @route   POST /api/discounts/verify
 * @desc    Verify discount code
 * @access  Public
 */
export const verifyDiscount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { code, carId, dates, totalAmount } = req.body;

    // Find discount code
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!discount) {
      return res.status(HTTP_STATUS.OK).json(
        ApiResponse.success('No discount applied', {
          code,
          discountAmount: 0,
          message: 'Invalid or expired discount code',
          isValid: false,
        })
      );
    }

    // Check if discount is valid
    const now = new Date();
    if (now < discount.validFrom || now > discount.validUntil) {
      return res.status(HTTP_STATUS.OK).json(
        ApiResponse.success('No discount applied', {
          code,
          discountAmount: 0,
          message: 'Discount code has expired',
          isValid: false,
        })
      );
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return res.status(HTTP_STATUS.OK).json(
        ApiResponse.success('No discount applied', {
          code,
          discountAmount: 0,
          message: 'Discount code usage limit reached',
          isValid: false,
        })
      );
    }

    // Check minimum purchase
    if (discount.minPurchase && totalAmount < discount.minPurchase) {
      return res.status(HTTP_STATUS.OK).json(
        ApiResponse.success('No discount applied', {
          code,
          discountAmount: 0,
          message: `Minimum purchase of ₦${discount.minPurchase.toLocaleString()} required`,
          isValid: false,
        })
      );
    }

    // Check if discount is applicable to this car
    if (
      discount.applicableTo &&
      discount.applicableTo.length > 0 &&
      !discount.applicableTo.includes(carId)
    ) {
      return res.status(HTTP_STATUS.OK).json(
        ApiResponse.success('No discount applied', {
          code,
          discountAmount: 0,
          message: 'Discount code not applicable to this car',
          isValid: false,
        })
      );
    }

    // Get car price for calculation
    const car = await Car.findById(carId);
    if (!car) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Car not found');
    }

    // Calculate discount (applied to first day only)
    let discountAmount = 0;

    if (discount.discountType === 'percentage') {
      discountAmount = (car.price * discount.discountValue) / 100;

      // Apply max discount if set
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      // Fixed discount
      discountAmount = discount.discountValue;
    }

    // Ensure discount doesn't exceed car price for one day
    if (discountAmount > car.price) {
      discountAmount = car.price;
    }

    // Increment usage count
    discount.usageCount += 1;
    await discount.save();

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Discount applied successfully', {
        code: discount.code,
        discountAmount,
        discountPercentage:
          discount.discountType === 'percentage'
            ? discount.discountValue
            : null,
        message: `${
          discount.discountType === 'percentage'
            ? discount.discountValue + '%'
            : '₦' + discount.discountValue.toLocaleString()
        } discount applied to first day!`,
        isValid: true,
      })
    );
  }
);

/**
 * @route   POST /api/admin/discounts
 * @desc    Create discount code
 * @access  Private/Admin
 */
export const createDiscount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minPurchase,
      validFrom,
      validUntil,
      usageLimit,
      applicableTo,
    } = req.body;

    // Check if code already exists
    const existingDiscount = await Discount.findOne({
      code: code.toUpperCase(),
    });
    if (existingDiscount) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Discount code already exists');
    }

    const discount = await Discount.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscount,
      minPurchase,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit,
      applicableTo,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(ApiResponse.success('Discount created successfully', discount));
  }
);

/**
 * @route   GET /api/admin/discounts
 * @desc    Get all discounts
 * @access  Private/Admin
 */
export const getDiscounts = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const discounts = await Discount.find().sort({ createdAt: -1 });

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Discounts retrieved successfully', discounts));
  }
);

/**
 * @route   PATCH /api/admin/discounts/:id
 * @desc    Update discount
 * @access  Private/Admin
 */
export const updateDiscount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!discount) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Discount not found');
    }

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Discount updated successfully', discount));
  }
);

/**
 * @route   DELETE /api/admin/discounts/:id
 * @desc    Delete discount
 * @access  Private/Admin
 */
export const deleteDiscount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (!discount) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Discount not found');
    }

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Discount deleted successfully', null));
  }
);
