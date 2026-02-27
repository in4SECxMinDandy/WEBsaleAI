import rateLimit from 'express-rate-limit';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function rateLimiter(options: RateLimitOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? 60 * 1000,
    max: options.max ?? 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message ?? 'Too many requests, please try again later.',
    },
    skip: () => process.env.NODE_ENV === 'test',
  });
}
