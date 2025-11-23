export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ITEMS_PER_PAGE = {
  CARS: 12,
  BOOKINGS: 10,
  PAYMENTS: 10,
} as const;

export const CAR_TYPES = ['SUV', 'Sedan', 'Van'] as const;
export const CAR_STATUS = ['available', 'unavailable', 'maintenance'] as const;
export const BOOKING_STATUS = ['pending', 'completed', 'cancelled'] as const;
export const PAYMENT_STATUS = [
  'pending',
  'completed',
  'failed',
  'refunded',
] as const;
export const PAYMENT_METHODS = ['stripe', 'paystack'] as const;

export const MAX_CAR_IMAGES = 3;
export const MAX_BOOKING_DATES = 7;
