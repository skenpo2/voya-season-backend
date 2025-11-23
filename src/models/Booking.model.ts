import mongoose, { Document, Schema } from 'mongoose';

interface BookingDate {
  date: Date;
  time: string;
}

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface IBooking extends Document {
  carId: mongoose.Types.ObjectId;
  customer: Customer;
  dates: BookingDate[];
  pickup: string;
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
  discountAmount?: number;
  discountCode?: string;
  finalAmount: number;
  paymentMethod: 'stripe' | 'paystack';
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    carId: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
    },
    customer: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    dates: [
      {
        date: {
          type: Date,
          required: true,
        },
        time: {
          type: String,
          required: true,
        },
      },
    ],
    pickup: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountCode: String,
    finalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paystack'],
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ 'customer.email': 1, createdAt: -1 });
bookingSchema.index({ carId: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
