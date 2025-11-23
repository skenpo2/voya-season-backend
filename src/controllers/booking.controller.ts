import { Response, NextFunction } from 'express';
import { Car } from '../models/Car.model';
import { Payment } from '../models/Payment.model';
import { PaymentService } from '../services/payment.service';
import { EmailService } from '../services/email.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS, ITEMS_PER_PAGE } from '../config/constants';
import { AuthRequest, PaginationQuery } from '../types';
import { Booking } from '@/models/Booking.model';

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Public
 */
export const createBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      whatsapp,
      pickup,
      carId,
      dates,
      paymentMethod,
      discountCode,
    } = req.body;

    // 1. Validate car exists
    const car = await Car.findById(carId);
    if (!car) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Car not found');
    }

    // 2. Check Availability (Basic check)
    // TODO: specific date overlap check should go here
    if (!car.available) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Car is not available');
    }

    // 3. Calculate amounts safely
    const totalAmount = dates.length * car.price;

    // Server-side discount logic
    let calculatedDiscount = 0;
    if (discountCode) {
      // Mock logic: Replace this with actual Coupon/Promo lookup in DB
      // const coupon = await Coupon.findOne({ code: discountCode });
      // if (coupon && coupon.isValid) calculatedDiscount = coupon.amount;

      // For now, default to 0 to prevent hacking
      calculatedDiscount = 0;
    }

    const finalAmount = totalAmount - calculatedDiscount;

    // 4. Create booking
    const booking = await Booking.create({
      carId,
      customer: {
        firstName,
        lastName,
        email,
        phone: whatsapp,
      },
      dates: dates.map((d: any) => ({
        date: new Date(d.date),
        time: d.time,
      })),
      pickup,
      totalAmount,
      discountAmount: calculatedDiscount, // Use server calculated value
      discountCode: discountCode || undefined,
      finalAmount,
      paymentMethod,
      status: 'pending',
    });

    // 5. Initialize payment
    const paymentReference = PaymentService.generateReference();

    if (paymentMethod === 'paystack') {
      // FIX: Removed "metadata:" label
      const paymentResponse = await PaymentService.initializePaystackPayment(
        finalAmount,
        email,
        paymentReference,
        {
          bookingId: booking._id.toString(),
          carName: car.name,
          customerId: email,
        }
      );

      // Create payment record
      await PaymentService.createPayment({
        bookingId: booking._id,
        amount: finalAmount,
        currency: 'NGN',
        status: 'pending',
        paymentMethod: 'paystack',
        transactionReference: paymentReference,
        // FIX: Access properties directly (assuming service returns response.data)
        paystackReference: paymentResponse.reference,
        customerEmail: email,
        metadata: paymentResponse,
      });

      res.status(HTTP_STATUS.CREATED).json(
        ApiResponse.success('Booking created successfully', {
          booking,
          payment: {
            // FIX: Access authorization_url directly
            authorizationUrl: paymentResponse.authorization_url,
            reference: paymentReference,
          },
        })
      );
    } else {
      res.status(HTTP_STATUS.CREATED).json(
        ApiResponse.success('Booking created successfully', {
          booking,
          message: 'Payment method not fully supported yet',
        })
      );
    }
  }
);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings with pagination
 * @access  Private/Admin
 */
export const getBookings = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = '1', limit = '10', status } = req.query as PaginationQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get bookings with pagination
    const [bookings, totalItems] = await Promise.all([
      Booking.find(query)
        .populate('carId', 'name price type images features')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    // Format response
    const formattedBookings = bookings.map((booking) => ({
      id: booking._id,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      baseLocation: booking.pickup,
      startingTime: booking.dates[0]?.time || '',
      status: booking.status,
      carId: booking.carId,
      carName: (booking.carId as any)?.name || '',
      pickupDate: booking.dates[0]?.date || '',
      createdAt: booking.createdAt,
    }));

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(
        'Bookings retrieved successfully',
        formattedBookings,
        {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        }
      )
    );
  }
);

/**
 * @route   GET /api/admin/bookings/:id
 * @desc    Get booking details
 * @access  Private/Admin
 */
export const getBookingDetail = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id)
      .populate('carId')
      .populate('paymentId');

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    const car = booking.carId as any;
    const payment = booking.paymentId as any;

    const bookingDetail = {
      id: booking._id,
      status: booking.status,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      baseLocation: booking.pickup,
      startingTime: booking.dates[0]?.time || '',
      createdAt: booking.createdAt,
      carId: car._id,
      customer: {
        firstName: booking.customer.firstName,
        lastName: booking.customer.lastName,
        email: booking.customer.email,
        phone: booking.customer.phone,
      },
      car: {
        id: car._id,
        name: car.name,
        price: car.price,
        type: car.type,
        images: car.images,
        features: car.features,
      },
      dates: booking.dates,
      payment: payment
        ? {
            id: payment._id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
          }
        : null,
      totalAmount: booking.totalAmount,
      discountAmount: booking.discountAmount,
      finalAmount: booking.finalAmount,
    };

    res
      .status(HTTP_STATUS.OK)
      .json(
        ApiResponse.success(
          'Booking detail retrieved successfully',
          bookingDetail
        )
      );
  }
);

/**
 * @route   PATCH /api/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Private/Admin
 */
export const updateBookingStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid status');
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    res
      .status(HTTP_STATUS.OK)
      .json(
        ApiResponse.success('Booking status updated successfully', booking)
      );
  }
);

/**
 * @route   DELETE /api/admin/bookings/:id
 * @desc    Delete booking
 * @access  Private/Admin
 */
export const deleteBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    // Delete associated payment if exists
    if (booking.paymentId) {
      await Payment.findByIdAndDelete(booking.paymentId);
    }

    await Booking.findByIdAndDelete(req.params.id);

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Booking deleted successfully', null));
  }
);
