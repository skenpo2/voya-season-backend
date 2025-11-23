import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(
    to: string,
    bookingDetails: {
      id: string;
      car: string;
      amount: number;
    }
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: 'Booking Confirmation - VOYA Car Rental',
        html: `
          <h1>Booking Confirmation</h1>
          <p>Thank you for your booking!</p>
          <p>Booking ID: ${bookingDetails.id}</p>
          <p>Car: ${bookingDetails.car}</p>
          <p>Total Amount: ₦${bookingDetails.amount.toLocaleString()}</p>
        `,
      });
      logger.info(`Booking confirmation email sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send booking confirmation email:', error);
    }
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(
    to: string,
    paymentDetails: {
      reference: string;
      amount: number;
    }
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: 'Payment Confirmation - VOYA Car Rental',
        html: `
          <h1>Payment Confirmed</h1>
          <p>Your payment has been processed successfully!</p>
          <p>Transaction Reference: ${paymentDetails.reference}</p>
          <p>Amount: ₦${paymentDetails.amount.toLocaleString()}</p>
        `,
      });
      logger.info(`Payment confirmation email sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send payment confirmation email:', error);
    }
  }
}
