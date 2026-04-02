export {
  authenticate,
  optionalAuth,
  type AuthenticatedRequestUser,
} from '@/core/middleware/auth.middleware'
export { requireRoles as authorize } from '@/core/middleware/role.middleware'
