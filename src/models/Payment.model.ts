import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paystack';
  transactionReference: string;
  paystackReference?: string;
  customerEmail: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paystack'],
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
    },
    paystackReference: String,
    customerEmail: {
      type: String,
      required: true,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Index
paymentSchema.index({ transactionReference: 1 });
paymentSchema.index({ bookingId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
