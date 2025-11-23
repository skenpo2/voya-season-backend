import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS } from '../config/constants';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(', ');

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorMessages);
  }

  next();
};
