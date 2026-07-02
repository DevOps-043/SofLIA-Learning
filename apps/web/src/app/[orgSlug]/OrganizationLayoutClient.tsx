'use client';

import { useEffect, useMemo } from 'react';
import { useOrganizationStore, Organization } from '@/core/stores/organizationStore';
import {
  generateOrganizationBrandingTheme,
  BRANDING_THEME_ID,
} from '@/core/theme/organization-branding-theme';
import {
  OrganizationStylesProvider,
  OrganizationGlobalCSSInjector,
} from '@/features/business-panel/contexts/OrganizationStylesContext';
import type { OrganizationStyles } from '@/features/business-panel/contexts/OrganizationStylesContext';
import { PRESET_THEMES } from '@/features/business-panel/config/preset-themes';

interface OrganizationLayoutClientProps {
  children: React.ReactNode;
  organization: Organization;
}

/**
 * Client-side wrapper that:
 * 1. Syncs the organization from server-side validation into the Zustand store.
 * 2. Pre-computes the branding theme from brand colors (already fetched server-side)
 *    so the context initializes instantly without a separate API call.
 *    This solves the permission issue: BusinessUser employees cannot access the
 *    Business-admin-only styles endpoint, but the server component already has
 *    the brand colors so we can compute the theme here directly.
 */
export function OrganizationLayoutClient({
  children,
  organization,
}: OrganizationLayoutClientProps) {
  const setCurrentOrganization = useOrganizationStore(
    (state) => state.setCurrentOrganization
  );
  const setUserOrganizations = useOrganizationStore(
    (state) => state.setUserOrganizations
  );
  const userOrganizations = useOrganizationStore(
    (state) => state.userOrganizations
  );

  useEffect(() => {
    setCurrentOrganization(organization);

    const exists = userOrganizations.some((org) => org.id === organization.id);
    if (!exists) {
      setUserOrganizations([...userOrganizations, organization]);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('last_organization_slug', organization.slug);
    }
  }, [
    organization,
    setCurrentOrganization,
    setUserOrganizations,
    userOrganizations,
  ]);

  const initialStyles = useMemo((): OrganizationStyles => {
    // `brandingEnabled` gates ALL branded surfaces (panel, user dashboard, login).
    // When the org disables custom branding — or has no brand colors configured —
    // every surface falls back to the platform SofLIA preset. The brand colors are
    // kept in the DB so re-enabling the toggle restores them instantly.
    const hasBrandColors = !!(
      organization.brandColorPrimary ||
      organization.brandColorAccent ||
      organization.brandColorSecondary
    );

    if (!organization.brandingEnabled || !hasBrandColors) {
      const sofliaTheme = PRESET_THEMES['SOFLIA'];
      return {
        panel: sofliaTheme.panel,
        userDashboard: sofliaTheme.userDashboard,
        login: sofliaTheme.login,
        selectedTheme: 'SOFLIA',
        supportsDualMode: sofliaTheme.supportsDualMode,
        lightMode: sofliaTheme.lightMode,
      };
    }

    const theme = generateOrganizationBrandingTheme({
      brand_color_primary: organization.brandColorPrimary ?? null,
      brand_color_secondary: organization.brandColorSecondary ?? null,
      brand_color_accent: organization.brandColorAccent ?? null,
      brand_font_family: organization.brandFontFamily ?? null,
    });

    return {
      panel: theme.panel,
      userDashboard: theme.userDashboard,
      login: theme.login,
      selectedTheme: BRANDING_THEME_ID,
      supportsDualMode: true,
      lightMode: theme.lightMode,
    };
  }, [
    organization.brandingEnabled,
    organization.brandColorPrimary,
    organization.brandColorSecondary,
    organization.brandColorAccent,
    organization.brandFontFamily,
  ]);

  return (
    <OrganizationStylesProvider orgSlug={organization.slug} initialStyles={initialStyles}>
      <OrganizationGlobalCSSInjector />
      {children}
    </OrganizationStylesProvider>
  );
}
