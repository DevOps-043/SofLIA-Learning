'use client'

import { Building2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOrganizationStore, useCurrentOrganizationSlug } from '@/core/stores/organizationStore'
import { useThemeStore } from '@/core/stores/themeStore'
import { darkenHexColor, hexToRgbChannels } from '@/core/theme/color-engine'
import { resolveOrganizationBrandColors } from '@/core/theme/organization-brand-colors'
import { NotificationBell } from '../NotificationBell'
import { UserDropdown } from '../UserDropdown'

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

  const textColor = isDark ? '#ffffff' : '#111827'
  const logoSrc = org?.brandLogoUrl ?? org?.logoUrl ?? null
  const primaryDisplay = primary ?? 'var(--color-primary)'

  return (
    <nav
      className="sticky top-0 z-[120] w-full backdrop-blur-xl"
      style={{ backgroundColor: navBg }}
    >
      {/* Gradient accent line at the bottom — same as ModernNavbar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 18.8%, transparent), color-mix(in srgb, ${primaryDisplay} 18.8%, transparent), transparent)`,
        }}
      />

      <div className="mx-auto w-full max-w-[1920px] flex h-16 items-center justify-between pl-2 pr-4 sm:pl-4 sm:pr-6 lg:pl-6 lg:pr-8">
        {/* Brand — org logo + name */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={org?.name ?? 'Organización'}
                width={180}
                height={48}
                className="h-10 w-auto max-w-[140px] object-contain rounded-lg sm:h-12 sm:max-w-[180px]"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/icono.png'
                }}
              />
            ) : (
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryDisplay}, ${accent})`,
                  boxShadow: `0 4px 20px color-mix(in srgb, ${primaryDisplay} 18.8%, transparent)`,
                }}
              >
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            {/* Accent dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
              style={{
                backgroundColor: accent,
                borderColor: isDark ? 'rgb(15,20,25)' : '#ffffff',
              }}
            />
          </div>

          {org?.showNavbarName !== false && org?.name && (
            <h1
              className="hidden sm:block text-lg font-bold leading-tight tracking-tight truncate max-w-[200px] sm:max-w-[280px]"
              style={{ color: textColor }}
            >
              {org.name}
            </h1>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-4">
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
    </nav>
  )
}
