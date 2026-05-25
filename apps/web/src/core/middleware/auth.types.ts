export const VALID_ROLES = [
  'Usuario',
  'Instructor',
  'Administrador',
  'Business',
  'Business User',
] as const;

export type ValidRole = typeof VALID_ROLES[number];

export const ROLE_ROUTES = {
  admin: ['/admin'],
  instructor: ['/instructor', '/courses/create', '/courses/edit'],
  user: ['/dashboard', '/profile', '/communities', '/courses'],
  business: ['/business-panel'],
} as const;

export type SecurityEvent =
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'EXPIRED_SESSION_ACCESS'
  | 'USER_NOT_FOUND'
  | 'INACTIVE_USER_ACCESS'
  | 'INVALID_ROLE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ROLE_VALIDATION_SUCCESS';

export interface ValidationResult {
  isValid: boolean;
  userId?: string;
  role?: ValidRole;
  error?: string;
}

export interface AuthUserRow {
  id: string;
  cargo_rol: string | null;
  email: string | null;
  username: string | null;
}
