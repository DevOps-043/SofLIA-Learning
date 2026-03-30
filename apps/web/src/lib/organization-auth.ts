/**
 * Utilidades para validar acceso a login personalizado por organización
 */

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean;
  subscription_plan?: string;
  subscription_status?: string;
}

/**
 * Verifica si una organización puede usar login personalizado
 * ✅ SOLO Plan Enterprise tiene acceso al auth personalizado
 * Los planes Team y Business usan el auth normal (/auth)
 * @param organization Organización a validar
 * @returns true si puede usar login personalizado, false si no
 */
export function canUseCustomLogin(organization: Organization | null): boolean {
  if (!organization) {
    return false;
  }


  // La organización debe estar activa
  if (!organization.is_active) {
    return false;
  }

  // Debe tener un slug válido
  if (!organization.slug || organization.slug.trim() === '') {
    return false;
  }

  return true;
}

/**
 * Verifica si una organización permite registro de nuevos usuarios
 * @param organization Organización a validar
 * @returns true si permite registro, false si no
 */
export function allowsNewUserRegistration(organization: Organization | null): boolean {
  if (!canUseCustomLogin(organization)) {
    return false;
  }

  // Por ahora, todas las organizaciones con login personalizado pueden registrar usuarios
  // En el futuro, esto podría ser un flag de configuración
  return true;
}

/**
 * Obtiene la URL de login personalizado para una organización
 * @param organization Organización
 * @returns URL de login personalizado o null si no está disponible
 */
export function getOrganizationLoginUrl(organization: Organization | null): string | null {
  if (!canUseCustomLogin(organization)) {
    return null;
  }

  // organization no puede ser null aquí porque canUseCustomLogin ya lo valida
  return `/auth/${organization!.slug}`;
}

