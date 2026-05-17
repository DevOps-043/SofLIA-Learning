import { ROLE_ROUTES, VALID_ROLES, type ValidRole } from './auth.types';

export function normalizeRole(role: unknown): ValidRole | null {
  if (typeof role !== 'string') return null;

  const trimmed = role.trim();
  return VALID_ROLES.includes(trimmed as ValidRole) ? trimmed as ValidRole : null;
}

export function hasRoleAccess(role: ValidRole, pathname: string): boolean {
  if (role === 'Administrador') return true;
  if (role === 'Instructor') return hasInstructorAccess(pathname);
  if (role === 'Business') return hasBusinessAccess(pathname);
  if (role === 'Usuario') return hasUserAccess(pathname);

  return false;
}

function hasInstructorAccess(pathname: string): boolean {
  if (matchesRoute(pathname, ROLE_ROUTES.admin)) return false;

  return (
    matchesRoute(pathname, ROLE_ROUTES.instructor) ||
    matchesRoute(pathname, ROLE_ROUTES.user)
  );
}

function hasBusinessAccess(pathname: string): boolean {
  if (matchesRoute(pathname, ROLE_ROUTES.admin)) return false;

  const isOrgScopedPanel = pathname.includes('/business-panel');
  const isOrgScopedUser = pathname.includes('/business-user');

  return (
    matchesRoute(pathname, ROLE_ROUTES.business) ||
    isOrgScopedPanel ||
    isOrgScopedUser ||
    matchesRoute(pathname, ROLE_ROUTES.user)
  );
}

function hasUserAccess(pathname: string): boolean {
  const blocked =
    matchesRoute(pathname, ROLE_ROUTES.admin) ||
    matchesRoute(pathname, ROLE_ROUTES.instructor);

  return !blocked && matchesRoute(pathname, ROLE_ROUTES.user);
}

function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}
