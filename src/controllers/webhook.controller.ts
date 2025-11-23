import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { logger } from '@/utils/logger';
import { HTTP_STATUS } from '../config/constants';

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Paystack sends the signature in the header
    const signature = req.headers['x-paystack-signature'] as string;

    // 2. The body contains the event details
    const eventData = req.body;

    if (!signature) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send('Signature missing');
    }

    // 3. Process async - Do NOT await this if it takes too long
    // However, for simple DB updates, awaiting is usually fine.
    await PaymentService.handleWebhook(signature, eventData);

    // 4. Always return 200 OK to Paystack
    res.status(HTTP_STATUS.OK).send('Webhook received');
  } catch (error: any) {
    // Log error but don't crash the server
    logger.error(`Webhook Error: ${error.message}`);
    // Still return 200 to Paystack so they stop sending the failed event (unless you want retries)
    res.status(HTTP_STATUS.OK).send('Webhook processed with errors');
  }
};
