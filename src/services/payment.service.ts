import crypto from 'crypto';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS } from '../config/constants';
import { Payment } from '../models/Payment.model';
import { Booking } from '../models/Booking.model';
import { logger } from '@/utils/logger';

import { Car } from '../models/Car.model';
import { sendBookingConfirmation } from '../services/email.service';
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

  static async handleWebhook(signature: string, rawBody: string) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error('Paystack secret missing');

    // A. Verify Signature
    // CRITICAL FIX: Hash the rawBody string directly.
    // Do NOT use JSON.stringify() here.
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      logger.error('Invalid Paystack webhook signature');
      // Using a generic Error here is fine as the Controller catches it
      throw new Error('Invalid signature');
    }

    // B. Parse JSON
    // Now that signature is verified, we can safely parse it to an object
    const eventData = JSON.parse(rawBody);

    // C. Handle 'charge.success'
    if (eventData.event === 'charge.success') {
      return await this.processSuccessfulPayment(eventData.data);
    }

    return true;
  }

  private static async processSuccessfulPayment(payload: any) {
    const { reference, amount, id, ...otherData } = payload;

    logger.info(`Webhook: Processing payment for ref ${reference}`);

    // A. Find the payment record
    const payment = await Payment.findOne({ transactionReference: reference });

    if (!payment) {
      logger.error(`Webhook: Payment record not found for ref ${reference}`);
      return false;
    }

    // B. Idempotency Check
    if (payment.status === 'completed') {
      logger.info(`Webhook: Payment ${reference} already processed`);
      return true;
    }

    // C. Amount Validation
    const expectedAmountInKobo = payment.amount * 100;
    if (expectedAmountInKobo !== amount) {
      logger.warn(
        `Webhook: Amount mismatch for ${reference}. DB: ${expectedAmountInKobo}, Paystack: ${amount}`
      );
    }

    // D. Update Payment Model
    payment.status = 'completed';
    payment.paystackReference = String(id);
    payment.metadata = {
      ...(payment.metadata || {}),
      webhook_event_id: id,
      ip_address: payload.ip_address,
      authorization: payload.authorization,
      channel: payload.channel,
      paid_at: payload.paid_at,
    };

    await payment.save();

    // E. Update Booking & Send Email
    if (payment.bookingId) {
      // 1. Fetch the booking document
      const booking = await Booking.findById(payment.bookingId);

      if (booking) {
        // 2. Update Booking Status
        booking.status = 'completed';
        await booking.save();

        logger.info(`Webhook: Booking ${payment.bookingId} confirmed`);

        // 3. Fetch Car Details (Needed for the email template)
        const car = await Car.findById(booking.carId);
        const carName = car ? car.name : 'Premium Vehicle';

        // 4. Prepare Email Data
        // We map the database fields to the Email Interface we created earlier
        const emailDetails = {
          customerFirstName: booking.customer.firstName,
          bookingId: booking._id.toString().toUpperCase().slice(-6), // e.g. "A1B2C3"
          carModel: carName,
          pickupAddress: booking.pickup,
          dates: booking.dates.map((d: any) => ({
            date: new Date(d.date),
            time: d.time,
          })),
          notes: '', // Add booking notes if your schema supports it
        };

        // 5. Send Email
        // We wrap this in a try-catch so email failure doesn't crash the Webhook response
        try {
          await sendBookingConfirmation(booking.customer.email, emailDetails);
          logger.info(`Webhook: Email sent to ${booking.customer.email}`);
        } catch (emailError) {
          logger.error(
            `Webhook: Failed to send email for booking ${booking._id}`,
            emailError
          );
        }
      }
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
        amount: payment.amount,
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
