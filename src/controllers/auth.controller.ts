import { Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Admin } from '../models/Admin.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../config/constants';
import { AuthRequest } from '../types';

/**
 * Generate JWT token
 */
const generateToken = (id: string, email: string, role: string): string => {
  const payload = { id, email, role };
  const secret = process.env.JWT_SECRET as string;
  const options: SignOptions = {
    expiresIn: '7d',
  };

  return jwt.sign(payload, secret, options);
};

/**
 * @route   POST /api/admin/login
 * @desc    Login admin
 * @access  Public
 */
export const login = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Check if email and password provided
    if (!email || !password) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Please provide email and password'
      );
    }

    // Find admin and include password
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
    }

    // Check password
    const isPasswordCorrect = await admin.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(admin._id.toString(), admin.email, admin.role);

    // Remove password from response
    const adminData = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
    };

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Login successful', {
        token,
        admin: adminData,
      })
    );
  }
);

/**
 * @route   GET /api/admin/me
 * @desc    Get current admin
 * @access  Private
 */
export const getCurrentAdmin = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const admin = await Admin.findById(req.admin!.id);

    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin not found');
    }

    res.status(HTTP_STATUS.OK).json(ApiResponse.success('Success', admin));
  }
);

/**
 * @route   POST /api/admin/register (Super Admin only)
 * @desc    Register new admin
 * @access  Private/Super Admin
 */
export const register = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, email, password, role } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Admin already exists');
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'admin',
    });

    const adminData = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    res
      .status(HTTP_STATUS.CREATED)
      .json(ApiResponse.success('Admin created successfully', adminData));
  }
);
