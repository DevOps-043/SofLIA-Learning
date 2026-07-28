'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  generateCSSVariables,
  getBackgroundStyle,
  hexToRgb,
} from '../../../business-panel/utils/styles';
import { AuthExperience } from '../AuthExperience';
import {
  OrganizationAuthStylesProvider,
  useOrganizationAuthStyles,
} from './useOrganizationAuthStyles';
import type { OrganizationAuthStyles } from './organization-auth.styles';

function toOpaqueColor(color: string): string {
  if (color.startsWith('#')) return `rgb(${hexToRgb(color)})`;

  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const [red, green, blue] = rgbaMatch[1].split(',');
    if (red && green && blue) {
      return `rgb(${red.trim()}, ${green.trim()}, ${blue.trim()})`;
    }
  }

  return color;
}

interface OrganizationAuthLayoutProps {
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    logo_url: string | null;
    description?: string | null;
    brand_color_primary?: string | null;
    brand_color_secondary?: string | null;
    brand_font_family?: string | null;
    brand_favicon_url?: string | null;
    login_styles?: OrganizationAuthStyles | null;
  };
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  variant?: 'default' | 'registration';
}

export function OrganizationAuthLayout({
  organization,
  children,
  isLoading = false,
  error = null,
  variant = 'default',
}: OrganizationAuthLayoutProps) {
  const { t } = useTranslation('common');
  const organizationSlug = organization.slug || '';
  const authStyles = useOrganizationAuthStyles(
    organizationSlug,
    organization.login_styles ?? null,
  );
  const { isDark, loginStyles } = authStyles;

  const logoUrl =
    organization.logo_url || organization.brand_favicon_url || '/icono.png';
  const primaryColor =
    loginStyles?.primary_button_color ||
    organization.brand_color_primary ||
    'var(--color-accent)';
  const defaultCardBg = isDark
    ? 'var(--color-legacy-1a1a2e)'
    : 'rgba(255, 255, 255, 0.92)';
  const defaultText = isDark
    ? 'var(--color-bg-light)'
    : 'var(--color-legacy-0f172a)';
  const defaultBorder = isDark
    ? 'rgba(71, 85, 105, 0.42)'
    : 'rgba(226, 232, 240, 0.88)';
  const defaultPageBg = isDark
    ? 'var(--color-legacy-0a0f14)'
    : 'var(--home-bg)';

  const cardBackground = loginStyles?.card_background || defaultCardBg;
  const cardOpacity = loginStyles?.card_opacity ?? 0.96;
  const borderColor = loginStyles?.border_color || defaultBorder;
  const textColor = loginStyles?.text_color || defaultText;

  let cardBackgroundColor = cardBackground;
  if (cardBackground.startsWith('#')) {
    cardBackgroundColor = `rgba(${hexToRgb(cardBackground)}, ${cardOpacity})`;
  } else {
    const rgbaMatch = cardBackground.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const [red, green, blue] = rgbaMatch[1].split(',');
      if (red && green && blue) {
        cardBackgroundColor = `rgba(${red}, ${green}, ${blue}, ${cardOpacity})`;
      }
    }
  }

  const customBackground = getBackgroundStyle(loginStyles);
  const pageStyle: React.CSSProperties = {
    ...(loginStyles?.background_type === 'image' && loginStyles.background_value
      ? {}
      : { backgroundColor: defaultPageBg }),
    ...customBackground,
    ...generateCSSVariables(loginStyles),
    '--autofill-bg': toOpaqueColor(cardBackground),
    '--autofill-text': textColor,
    color: textColor,
  } as React.CSSProperties;

  return (
    <OrganizationAuthStylesProvider value={authStyles}>
      <AuthExperience
        brand={{
          logoUrl,
          name: organization.name,
          primaryColor,
        }}
        pageStyle={pageStyle}
        panelStyle={{
          backgroundColor: cardBackgroundColor,
          borderColor,
          color: textColor,
        }}
        variant={variant === 'registration' ? 'registration' : 'default'}
      >
        <div className="relative z-10 w-full">
          {isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: primaryColor }}
                aria-hidden="true"
              />
              <p className="text-sm font-medium opacity-60">
                {t('actions.loading')}
              </p>
            </div>
          ) : null}

          {error && !isLoading ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p className="text-sm font-medium text-red-500">{error}</p>
            </div>
          ) : null}

          {!isLoading ? children : null}
        </div>
      </AuthExperience>
    </OrganizationAuthStylesProvider>
  );
}
