import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service'; // Adjust path
import { logger } from '../utils/logger'; // Adjust path

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Get the signature
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      return res.status(400).send('Signature missing');
    }

    // 2. CRITICAL: Convert Buffer to String
    // Since we used express.raw(), req.body is a Buffer.
    // We need the exact string for the hash verification to work.
    const rawBody = req.body.toString();

    // 3. Delegate to Service
    // We pass the rawBody (string) so the service can hash it correctly,
    // and then parse it to JSON internally.
    await PaymentService.handleWebhook(signature, rawBody);

    // 4. Always return 200 OK to Paystack
    res.status(200).send('Webhook received');
  } catch (error: any) {
    // Log error but don't crash server
    logger.error(`Webhook Error: ${error.message}`);

    // Still return 200 to prevent Paystack from retrying (unless it's a temporary error you want to retry)
    res.status(200).send('Webhook processed with errors');
  }
};
