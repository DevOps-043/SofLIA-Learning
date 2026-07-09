import { RateLimitTier } from './rate-limit.types';

export const RATE_LIMIT_CONFIG = {
  [RateLimitTier.AUTH]: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    blockDurationMs: 60 * 60 * 1000,
  },
  [RateLimitTier.ADMIN]: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000,
    message: 'Demasiadas peticiones administrativas. Intenta de nuevo mÃ¡s tarde.',
    blockDurationMs: 30 * 60 * 1000,
  },
  [RateLimitTier.API_MUTATION]: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Demasiadas peticiones. Intenta de nuevo en un momento.',
    blockDurationMs: 5 * 60 * 1000,
  },
  [RateLimitTier.API_READ]: {
    maxRequests: 300,
    windowMs: 60 * 1000,
    message: 'Demasiadas peticiones. Por favor espera un momento.',
    blockDurationMs: 2 * 60 * 1000,
  },
  [RateLimitTier.AI_GENERATION]: {
    maxRequests: 3,
    windowMs: 10 * 60 * 1000,
    message: 'Demasiadas generaciones con IA. Intenta de nuevo en unos minutos.',
    blockDurationMs: 10 * 60 * 1000,
  },
  [RateLimitTier.PUBLIC]: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
    message: 'Demasiadas peticiones. Por favor espera un momento.',
    blockDurationMs: 1 * 60 * 1000,
  },
};
