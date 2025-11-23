import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AdminPayload extends JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
}

// FIX 1: Remove Omit<Request, 'files'>
// FIX 2: Allow files to be Array OR Dictionary (standard Multer type)
export interface AuthRequest extends Request {
  admin?: AdminPayload;
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

export interface BookingDate {
  date: Date;
  time: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  type?: string;
  status?: string;
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data: Record<string, unknown>;
}
