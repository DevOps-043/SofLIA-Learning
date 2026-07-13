/**
 * Única fuente de verdad del rol de superadmin de plataforma.
 *
 * El rol vive en `users.cargo_rol` como texto libre, por lo que la comparación
 * se normaliza (trim + minúsculas). Todo control de acceso de plataforma —
 * `requireAdmin`, el middleware y el copiloto de SofLIA para superadmins —
 * debe usar este predicado para que no existan criterios divergentes.
 */

/** Valor canónico de `users.cargo_rol` para el superadmin de plataforma. */
export const PLATFORM_ADMIN_ROLE = 'administrador'

/** Valor canónico de `users.cargo_rol` para el rol de instructor. */
export const PLATFORM_INSTRUCTOR_ROLE = 'instructor'

function normalizeRole(cargoRol: string | null | undefined): string | undefined {
  return cargoRol?.toLowerCase().trim()
}

/** `true` si el cargo corresponde al superadmin de plataforma. */
export function isPlatformAdminRole(cargoRol: string | null | undefined): boolean {
  return normalizeRole(cargoRol) === PLATFORM_ADMIN_ROLE
}

/** `true` si el cargo corresponde a instructor. */
export function isPlatformInstructorRole(
  cargoRol: string | null | undefined,
): boolean {
  return normalizeRole(cargoRol) === PLATFORM_INSTRUCTOR_ROLE
}
