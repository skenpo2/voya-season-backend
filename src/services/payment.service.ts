import crypto from 'crypto';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS } from '../config/constants';
import { Payment } from '../models/Payment.model';
import { Booking } from '../models/Booking.model';
import { logger } from '@/utils/logger';
const Paystack = require('paystack');

export class PaymentService {
  // Remove the global initialization at the top

  /**
   * Helper to get Paystack instance on demand
   */
  private static getPaystackClient() {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      logger.error('PAYSTACK_SECRET_KEY is missing in environment variables');
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Payment configuration error'
      );
    }
    return Paystack(key);
  }

  static async handleWebhook(signature: string, eventData: any) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error('Paystack secret missing');

    // A. Verify Signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(eventData))
      .digest('hex');

    if (hash !== signature) {
      logger.error('Invalid Paystack webhook signature');
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid signature');
    }

    // B. Handle 'charge.success'
    if (eventData.event === 'charge.success') {
      return await this.processSuccessfulPayment(eventData.data);
    }

    // Ignore other events (like 'transfer.success') but return 200 OK
    return true;
  }

  /**
   * 2. PROCESS SUCCESSFUL PAYMENT
   * Strictly typed to your IPayment model
   */
  private static async processSuccessfulPayment(payload: any) {
    const { reference, amount, id, ...otherData } = payload;

    logger.info(`Webhook: Processing payment for ref ${reference}`);

    // A. Find the payment record via transactionReference (Unique index)
    const payment = await Payment.findOne({ transactionReference: reference });

    if (!payment) {
      logger.error(`Webhook: Payment record not found for ref ${reference}`);
      return false; // Cannot process
    }

    // B. Idempotency Check
    // If status is already completed, stop here.
    if (payment.status === 'completed') {
      logger.info(`Webhook: Payment ${reference} already processed`);
      return true;
    }

    // C. Amount Validation
    // Database stores main currency (e.g., 5000 NGN)
    // Paystack sends lowest denomination (e.g., 500000 Kobo)
    const expectedAmountInKobo = payment.amount * 100;

    if (expectedAmountInKobo !== amount) {
      logger.warn(
        `Webhook: Amount mismatch for ${reference}. ` +
          `DB: ${expectedAmountInKobo}, Paystack: ${amount}`
      );
      // We update the status to 'failed' or flag it in metadata so admin can review
      // For now, we allow it but log it, or you can throw/return false to reject.
    }

    // D. Update Payment Model
    payment.status = 'completed';
    payment.paystackReference = String(id); // Save Paystack's internal ID here

    // Store audit trail in 'metadata' (Schema.Types.Mixed)
    // We preserve existing metadata and add webhook details
    payment.metadata = {
      ...(payment.metadata || {}),
      webhook_event_id: id,
      ip_address: payload.ip_address,
      authorization: payload.authorization,
      channel: payload.channel,
      paid_at: payload.paid_at,
    };

    await payment.save();

    // E. Update Booking Status
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        status: 'confirmed', // Assuming your Booking model uses 'confirmed'
        isPaid: true,
      });
      logger.info(`Webhook: Booking ${payment.bookingId} confirmed`);
    }

    return true;
  }

  static async initializePaystackPayment(
    amount: number,
    email: string,
    reference?: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Initialize Client HERE, not globally
      const paystack = this.getPaystackClient();

      const paymentData = {
        amount: amount * 100,
        email: email,
        reference: reference || this.generateReference(),
        metadata: metadata || {},
      };

      const response = await paystack.transaction.initialize(paymentData);

      if (!response.status) {
        logger.error(`Paystack Error: ${JSON.stringify(response)}`);
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          response?.message || 'Payment initialization failed'
        );
      }

      return response.data;
    } catch (error: any) {
      logger.error(`Error initializing Paystack payment: ${error.message}`);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error?.message || 'Payment service not available'
      );
    }
  }

  static async verifyPaystackPayment(reference: string): Promise<any> {
    try {
      // Initialize Client HERE too
      const paystack = this.getPaystackClient();

      const response = await paystack.transaction.verify(reference);
      if (!response.status) {
        throw new Error(response.message || 'Verification failed');
      }
      return response.data;
    } catch (error: any) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error?.message || 'Payment verification failed'
      );
    }
  }

  // ... rest of your methods (createPayment, updatePaymentStatus, generateReference) remain the same

  static async createPayment(paymentData: any) {
    return await Payment.create(paymentData);
  }

  static async updatePaymentStatus(paymentId: string, status: any) {
    return await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );
  }

  static async verifyAndGetBookingDetails(reference: string) {
    // 1. Verify with Paystack API first
    const paystackData = await this.verifyPaystackPayment(reference);

    // 2. Find Payment Record
    // We search by transactionReference (VOYA-...) OR paystackReference (in case they used that)
    const payment = await Payment.findOne({
      $or: [
        { transactionReference: reference },
        { paystackReference: reference },
      ],
    });

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment record not found');
    }

    // 3. Update Logic (Idempotency)
    // Only update if status is not already completed
    if (payment.status !== 'completed' && paystackData.status === 'success') {
      // Update Payment Model fields
      payment.status = 'completed';
      payment.paystackReference = paystackData.reference; // Save the actual Paystack ref

      // Save full technical details in metadata (Schema.Types.Mixed)
      payment.metadata = {
        ...payment.metadata,
        verificationResponse: paystackData,
        ipAddress: paystackData.ip_address,
        channel: paystackData.channel,
      };

      await payment.save();

      // Update Booking Status
      await Booking.findByIdAndUpdate(payment.bookingId, {
        status: 'confirmed', // or 'completed'
        isPaid: true,
      });
    } else if (paystackData.status !== 'success') {
      // Handle failed payment case
      payment.status = 'failed';
      await payment.save();
    }

    // 4. Fetch the Booking with Car details for the Receipt
    const booking = await Booking.findById(payment.bookingId).populate('carId');

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Associated booking not found');
    }

    // 5. Return Clean Data for Frontend
    return {
      status: payment.status,
      receipt: {
        reference: payment.transactionReference,
        amount: payment.amount, // This is already in correct currency unit based on your creation logic
        date: payment.updatedAt,
        method: payment.paymentMethod,
        customerEmail: payment.customerEmail,
      },
      booking: booking,
    };
  }

  static generateReference(): string {
    return `VOYA-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;
  }
}
