'use client'

import type { CSSProperties } from 'react'
import { Building2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOrganizationStore, useCurrentOrganizationSlug } from '@/core/stores/organizationStore'
import { useThemeStore } from '@/core/stores/themeStore'
import { darkenHexColor, hexToRgbChannels } from '@/core/theme/color-engine'
import { resolveOrganizationBrandColors } from '@/core/theme/organization-brand-colors'
import { NotificationBell } from '../NotificationBell'
import { UserDropdown } from '../UserDropdown'
import styles from './OrgNavbar.module.css'

/**
 * Org-branded top navbar for business-user pages that live outside the dashboard shell.
 * Reads org and theme data directly from stores — no prop drilling required.
 * Mirrors the ModernNavbar visual design but is self-contained.
 *
 * Background computation mirrors buildDarkModeStyles in organization-branding-theme.ts:
 *   sidebar_background = darkenHexColor(primary, 0.60)
 * so the navbar color matches the dashboard's ModernNavbar exactly.
 */
export function OrgNavbar() {
  const router = useRouter()
  const { resolvedTheme } = useThemeStore()
  const org = useOrganizationStore((s) => s.currentOrganization)
  const orgSlug = useCurrentOrganizationSlug()

  const isDark = resolvedTheme !== 'light'
  // Gateado por brandingEnabled: con el branding apagado la navbar usa la
  // paleta de plataforma aunque la org conserve sus colores en la BD.
  const brand = resolveOrganizationBrandColors(org)
  const primary = brand.hasBranding ? brand.primaryColor : null
  const accent = brand.accentColor

  // Derive the same sidebar_background that OrganizationLayoutClient computes from
  // generateOrganizationBrandingTheme so the navbar color matches ModernNavbar on the dashboard.
  const hasBrandColors = brand.hasBranding
  const sidebarHex = hasBrandColors && isDark && primary
    ? darkenHexColor(primary, 0.60)
    : null

  let navBg: string
  if (sidebarHex) {
    // Convert hex → rgba with 0.95 opacity for the same glass-panel effect
    navBg = `rgba(${hexToRgbChannels(sidebarHex)}, 0.95)`
  } else {
    navBg = isDark ? 'rgba(15, 20, 25, 0.88)' : 'rgba(255, 255, 255, 0.92)'
  }

  const textColor = isDark ? 'var(--color-bg-light)' : 'var(--color-contrast)'
  const logoSrc = org?.brandLogoUrl ?? org?.logoUrl ?? null
  const primaryDisplay = primary ?? 'var(--color-primary)'

  return (
    <nav className={styles.shell}>
      <div
        className={styles.bar}
        style={{
          '--org-nav-bg': navBg,
          '--org-nav-accent': accent,
          '--org-nav-primary': primaryDisplay,
          '--org-nav-text': textColor,
        } as CSSProperties}
      >
      <div className={styles.inner}>
        {/* Brand — org logo + name */}
        <div className={styles.brand}>
          <div className={styles.mark}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={org?.name ?? 'Organización'}
                width={180}
                height={48}
                className={styles.logo}
                onError={(e) => {
                  const image = e.target as HTMLImageElement
                  image.src = '/icono.png'
                }}
              />
            ) : (
              <div className={styles.fallbackMark}>
                <Building2 className="h-5 w-5" />
              </div>
            )}
            {/* Accent dot */}
            <span className={styles.presence} aria-hidden="true" />
          </div>

          {org?.showNavbarName !== false && org?.name && (
            <h1 className={styles.name}>
              {org.name}
            </h1>
          )}
        </div>

        {/* Right actions */}
        <div className={styles.actions}>
          <NotificationBell />
          <UserDropdown
            onCertificatesClick={
              orgSlug ? () => router.push(`/${orgSlug}/certificates`) : undefined
            }
            onAnalyticsClick={
              orgSlug ? () => router.push(`/${orgSlug}/business-user/analytics`) : undefined
            }
            onProfileClick={
              orgSlug ? () => router.push(`/${orgSlug}/business-user/profile`) : undefined
            }
            onLogout={() => router.push('/auth?action=logout')}
          />
        </div>
      </div>
      </div>
    </nav>
  )
}
