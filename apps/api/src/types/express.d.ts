import type { AuthenticatedRequestUser } from '@/core/middleware/auth.middleware'

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser
    }
  }
}

export {}
