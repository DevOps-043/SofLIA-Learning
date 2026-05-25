export const RATE_LIMITS = {
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message:
      'Demasiados intentos de inicio de sesion. Intenta nuevamente en 15 minutos.',
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Demasiadas solicitudes. Por favor, espera un momento.',
  },
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000,
    message: 'Limite de solicitudes alcanzado. Espera un momento.',
  },
  create: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    message: 'Has creado demasiados recursos. Intenta nuevamente en 1 hora.',
  },
  upload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
    message: 'Limite de subidas alcanzado. Intenta nuevamente en 1 hora.',
  },
  strict: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Demasiados intentos. Por favor, espera 1 hora.',
  },
} as const
