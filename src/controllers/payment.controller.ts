import { Request, Response, NextFunction } from 'express';
import { Payment } from '../models/Payment.model';
import { Booking } from '../models/Booking.model';
import { PaymentService } from '../services/payment.service';
import { EmailService } from '../services/email.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../config/constants';
import { AuthRequest, PaginationQuery } from '../types';
import { transformMongoDocs } from '@/utils/transformers';

/**
 * @route   POST /api/payments/verify/:reference
 * @desc    Verify payment
 * @access  Public
 */
export const verifyPayment = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { reference } = req.params;

    // Find payment
    const payment = await Payment.findOne({ transactionReference: reference });

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found');
    }

    // Verify with Paystack
    const verification = await PaymentService.verifyPaystackPayment(
      payment.paystackReference!
    );

    if (verification.data.status === 'success') {
      // Update payment status
      payment.status = 'completed';
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(payment.bookingId, {
        status: 'completed',
        paymentId: payment._id,
      });

      // Send confirmation email
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        await EmailService.sendPaymentConfirmation(payment.customerEmail, {
          reference: payment.transactionReference,
          amount: payment.amount,
        });
      }

      res.status(HTTP_STATUS.OK).json(
        ApiResponse.success('Payment verified successfully', {
          payment,
          verification,
        })
      );
    } else {
      payment.status = 'failed';
      await payment.save();

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Payment verification failed'
      );
    }
  }
);

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments with pagination
 * @access  Private/Admin
 */
export const getPayments = asyncHandler(
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

    // Get payments with pagination
    const [payments, totalItems] = await Promise.all([
      Payment.find(query)
        .populate('bookingId', 'customer status')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(
        'Payments retrieved successfully',
        transformMongoDocs(payments),
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
 * @route   PATCH /api/admin/payments/:id/status
 * @desc    Update payment status
 * @access  Private/Admin
 */
export const updatePaymentStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;

    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid status');
    }

    const payment = await PaymentService.updatePaymentStatus(
      req.params.id,
      status
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ApiResponse.success('Payment status updated successfully', payment)
      );
  }
);

export const verifyPaymentCallback = asyncHandler(
  async (req: Request, res: Response) => {
    // Paystack sends ?trxref=...&reference=...
    const { reference, trxref } = req.query;

    // We prefer 'reference' (VOYA-...) but fallback to 'trxref'
    const refToVerify = (reference as string) || (trxref as string);

    if (!refToVerify) {
      throw new Error('No transaction reference found in URL');
    }

    const result = await PaymentService.verifyAndGetBookingDetails(refToVerify);

    res
      .status(HTTP_STATUS.OK)
      .json(ApiResponse.success('Payment status retrieved', result));
  }
);
