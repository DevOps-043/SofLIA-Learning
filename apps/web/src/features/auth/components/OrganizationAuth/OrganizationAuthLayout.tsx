'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { getBackgroundStyle, generateCSSVariables, hexToRgb } from '../../../business-panel/utils/styles';
import { useDevicePerformanceMode } from '../../../../lib/utils/mobile-performance';
import {
  OrganizationAuthStylesProvider,
  useOrganizationAuthStyles,
} from './useOrganizationAuthStyles';
import type { OrganizationAuthStyles } from './organization-auth.styles';

/**
 * Devuelve el color sin transparencia. La sombra interior que usamos para tapar
 * el autofill de Chrome debe ser opaca; si dejara pasar alfa, el blanco del
 * navegador seguiría viéndose por debajo.
 */
function toOpaqueColor(color: string): string {
  if (color.startsWith('#')) {
    return `rgb(${hexToRgb(color)})`;
  }

  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const [r, g, b] = rgbaMatch[1].split(',');
    if (r && g && b) {
      return `rgb(${r.trim()}, ${g.trim()}, ${b.trim()})`;
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
}

export function OrganizationAuthLayout({
  organization,
  children,
  isLoading = false,
  error = null,
}: OrganizationAuthLayoutProps) {
  const { t } = useTranslation('common');
  const organizationSlug = organization.slug || '';
  const authStyles = useOrganizationAuthStyles(
    organizationSlug,
    organization.login_styles ?? null,
  );
  const { disableHeavyEffects } = useDevicePerformanceMode();
  const isDark = authStyles.isDark;
  const loginStyles = authStyles.loginStyles;

  const faviconUrl = organization.brand_favicon_url || organization.logo_url || '/icono.png';
  const primaryColor = organization.brand_color_primary || 'var(--color-info)';
  const secondaryColor = organization.brand_color_secondary || 'var(--color-success)';

  // Aplicar estilos personalizados de login
  const backgroundStyle = getBackgroundStyle(loginStyles);
  const cssVariables = generateCSSVariables(loginStyles);

  // Usar colores de estilos personalizados si están disponibles
  const finalPrimaryColor = loginStyles?.primary_button_color || primaryColor;
  const finalSecondaryColor = loginStyles?.secondary_button_color || secondaryColor;
  
  // Calcular estilos de la tarjeta - Adaptativos
  const defaultCardBg = isDark ? 'var(--color-legacy-1a1a2e)' : 'rgba(255, 255, 255, 0.9)';
  const defaultText = isDark ? 'var(--color-bg-light)' : 'var(--color-legacy-0f172a)';
  const defaultBorder = isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)';
  const defaultPageBg = isDark ? 'var(--color-legacy-0f172a)' : 'var(--color-legacy-f0f4f8)';

  const cardBackground = loginStyles?.card_background || defaultCardBg;
  const cardOpacity = loginStyles?.card_opacity !== undefined ? loginStyles.card_opacity : 0.95;
  const borderColor = loginStyles?.border_color || defaultBorder;
  const textColor = loginStyles?.text_color || defaultText;

  let cardBackgroundColor: string;
  if (cardBackground.startsWith('#')) {
    const rgb = hexToRgb(cardBackground);
    cardBackgroundColor = `rgba(${rgb}, ${cardOpacity})`;
  } else if (cardBackground.startsWith('rgba')) {
    const rgbaMatch = cardBackground.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(',');
      if (parts.length >= 3) {
        cardBackgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${cardOpacity})`;
      } else {
        cardBackgroundColor = cardBackground;
      }
    } else {
      cardBackgroundColor = cardBackground;
    }
  } else {
    cardBackgroundColor = cardBackground;
  }

  // Si hay imagen de fondo definida en loginStyles, backgroundStyle la tendrá.
  // Si no, usamos el color de fondo por defecto adaptativo.
  const pageBackground =
    loginStyles?.background_type === 'image' && loginStyles.background_value
      ? {}
      : { backgroundColor: defaultPageBg };

  // Chrome pinta los campos autocompletados con su propio blanco, ignorando las
  // clases del input. Se le pasa el color REAL de la tarjeta (opaco, para que
  // tape el blanco) y del texto, de modo que el autofill respete el branding
  // tanto en tarjetas claras como oscuras. Ver global-overrides-29-autofill.css.
  const autofillVariables = {
    '--autofill-bg': toOpaqueColor(cardBackground),
    '--autofill-text': textColor,
  } as React.CSSProperties;

  const pageStyle: React.CSSProperties = {
    ...pageBackground,
    ...backgroundStyle,
    ...cssVariables,
    ...autofillVariables,
    color: textColor,
  };

  return (
    <OrganizationAuthStylesProvider value={authStyles}>
      <div
        className="min-h-screen flex items-center justify-center relative overflow-x-hidden overflow-y-auto transition-all duration-500"
        style={pageStyle}
      >
      {/* Animated Gradient Orbs */}
      {!loginStyles?.background_type && !disableHeavyEffects && (
        <>
          <motion.div
            className="absolute inset-0 z-0 fixed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Large gradient orbs */}
            <motion.div
              className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
              style={{
                background: `radial-gradient(circle, ${finalPrimaryColor}, transparent 60%)`,
              }}
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
              style={{
                background: `radial-gradient(circle, ${finalSecondaryColor}, transparent 60%)`,
              }}
              animate={{
                x: [0, -50, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </motion.div>
        </>
      )}

      {/* Layout: form first (top on mobile), logo second (bottom on mobile / left on desktop) */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 p-4 sm:p-6 lg:p-8 py-8 lg:py-12">

          {/* FORM — always rendered first: top on mobile, right on desktop */}
          <motion.div
            className="w-full max-w-md lg:max-w-xl lg:order-2 shrink-0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Login Card */}
            <div 
              className="relative backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-2xl rounded-3xl border overflow-hidden min-h-0 sm:min-h-[300px] flex flex-col justify-center"
              style={{
                backgroundColor: cardBackgroundColor,
                borderColor: borderColor,
                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px color-mix(in srgb, ${borderColor} 12.5%, transparent)`,
              }}
            >
              {/* Inner gradient overlay */}
              <motion.div 
                className="absolute inset-0 opacity-10 rounded-3xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${finalPrimaryColor} 12.5%, transparent), transparent, color-mix(in srgb, ${finalSecondaryColor} 12.5%, transparent))`,
                }}
              />

              {/* Shimmer effect */}
              {!disableHeavyEffects && (
                <motion.div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, transparent 30%, color-mix(in srgb, ${finalPrimaryColor} 12.5%, transparent) 50%, transparent 70%)`,
                  }}
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: 2
                  }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 w-full">
                {/* Organization Info */}
                {!isLoading && (
                  <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <motion.h1 
                      className="text-2xl lg:text-3xl font-bold mb-2 tracking-tight"
                      style={{
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        color: textColor,
                      }}
                    >
                      {organization.name}
                    </motion.h1>
                    {organization.description && (
                      <motion.p 
                        className="text-sm font-medium leading-relaxed"
                        style={{ color: `color-mix(in srgb, ${textColor} 56.5%, transparent)` }}
                      >
                        {organization.description}
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Loading State - Spinner */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div
                      className="w-12 h-12 border-4 rounded-full border-t-transparent"
                      style={{
                        borderColor: textColor,
                        borderTopColor: 'transparent', 
                        opacity: 0.2
                      }}
                    />
                     <motion.div
                      className="absolute w-12 h-12 border-4 rounded-full border-t-transparent"
                      style={{
                        borderColor: primaryColor,
                        borderTopColor: 'transparent',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-sm font-medium animate-pulse" style={{ color: textColor }}>
                      {t('actions.loading')}
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </motion.div>
                )}

                {/* Form Content - Siempre mostrar children si no está loading */}
                {!isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    {children}
                  </motion.div>
                )}
              </div>
            </div>
            {/* Mobile logo — below card, hidden on desktop */}
            <div className="lg:hidden flex justify-center mt-6 pb-2">
              <motion.div
                animate={disableHeavyEffects ? undefined : { y: [-8, 8, -8] }}
                transition={
                  disableHeavyEffects
                    ? undefined
                    : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                }
                className="relative w-20 h-20"
              >
                <Image
                  src={faviconUrl}
                  alt={`${organization.name} Logo`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="80px"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icono.png'; }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* LOGO — desktop only, left column */}
          <motion.div
            className="hidden lg:flex lg:order-1 flex-1 items-center justify-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="relative"
              animate={disableHeavyEffects ? undefined : { y: [-10, 10, -10] }}
              transition={
                disableHeavyEffects
                  ? undefined
                  : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                <motion.div
                  className="relative w-full h-full flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Image
                    src={faviconUrl}
                    alt={`${organization.name} Logo`}
                    fill
                    className="object-contain drop-shadow-2xl"
                    sizes="280px"
                    priority
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                </motion.div>
                {!disableHeavyEffects && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none -z-10 blur-[60px]"
                    style={{ background: `radial-gradient(circle, color-mix(in srgb, ${finalPrimaryColor} 25.1%, transparent), transparent 70%)` }}
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </OrganizationAuthStylesProvider>
  );
}
