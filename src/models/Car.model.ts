import mongoose, { Document, Schema } from 'mongoose';

interface CarFeatures {
  seats: number;
  fuel: string;
  duration: string;
  year: number;
  transmission?: string;
}

export interface ICar extends Document {
  name: string;
  price: number;
  type: 'SUV' | 'Sedan' | 'Van';
  images: string[];
  features: CarFeatures;
  rating?: number;
  trips?: number;
  available: boolean;
  status: 'available' | 'unavailable' | 'maintenance';
  amenities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const carSchema = new Schema<ICar>(
  {
    name: {
      type: String,
      required: [true, 'Car name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    type: {
      type: String,
      enum: ['SUV', 'Sedan', 'Van'],
      required: [true, 'Car type is required'],
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0 && v.length <= 3;
        },
        message: 'You must provide 1-3 images',
      },
    },
    features: {
      seats: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
      },
      fuel: {
        type: String,
        required: true,
      },
      duration: {
        type: String,
        default: '12 hours',
      },
      year: {
        type: Number,
        required: true,
        min: 2000,
      },
      transmission: {
        type: String,
        default: 'Auto',
      },
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    trips: {
      type: Number,
      default: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'maintenance'],
      default: 'available',
    },
    amenities: [String],
  },
  {
    timestamps: true,
  }
);

carSchema.index({ name: 'text', type: 1 });

export const Car = mongoose.model<ICar>('Car', carSchema);
