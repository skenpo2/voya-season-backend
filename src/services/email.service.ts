import { Resend } from 'resend';
import {
  generateBookingEmail,
  BookingDetails,
} from '../templates/booking-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendBookingConfirmation = async (
  userEmail: string,
  details: BookingDetails
) => {
  try {
    const html = generateBookingEmail(details);

    await resend.emails.send({
      from: 'VOYA Operations <support@voyaapp.co>',
      to: [userEmail],
      subject: 'Your VOYA Daily Driver Service Booking Is Confirmed',
      html: html,
    });

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};
