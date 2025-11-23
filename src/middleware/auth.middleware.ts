import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../config/constants';
import { AuthRequest, AdminPayload } from '../types';
import { Admin } from '../models/Admin.model';

export const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Not authorized to access this route'
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as AdminPayload;

      // Check if admin still exists
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Admin no longer exists');
      }

      req.admin = decoded;
      next();
    } catch (error) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
    }
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to perform this action'
      );
    }
    next();
  };
};
