import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

type AsyncFunction = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
