import type { Organization } from '@/core/stores/organizationStore'

/**
 * Colores de marca resueltos para el "chrome" de la app (navbar, menú de
 * usuario, switcher, botones flotantes).
 *
 * `brandingEnabled` es el ÚNICO interruptor: cuando la organización desactiva
 * el branding personalizado, las superficies vuelven a la paleta de plataforma
 * de SofLIA aunque los colores sigan guardados en la base de datos (se
 * conservan para restaurarlos al reactivar el toggle).
 *
 * Nunca leas `organization.brandColor*` directamente en un componente: hazlo a
 * través de este helper, si no el branding "se cuela" con el toggle apagado.
 */
export interface OrganizationBrandColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  /** true solo si el branding está activo y hay al menos un color configurado. */
  hasBranding: boolean
}

const PLATFORM_PRIMARY = 'var(--color-primary)'
const PLATFORM_ACCENT = 'var(--color-accent)'

export function resolveOrganizationBrandColors(
  organization: Organization | null | undefined,
): OrganizationBrandColors {
  const isEnabled = organization?.brandingEnabled === true
  const primary = isEnabled ? organization?.brandColorPrimary : null
  const secondary = isEnabled ? organization?.brandColorSecondary : null
  const accent = isEnabled ? organization?.brandColorAccent : null

  return {
    primaryColor: primary || PLATFORM_PRIMARY,
    secondaryColor: secondary || primary || PLATFORM_ACCENT,
    accentColor: accent || primary || PLATFORM_ACCENT,
    hasBranding: Boolean(primary || secondary || accent),
  }
}
