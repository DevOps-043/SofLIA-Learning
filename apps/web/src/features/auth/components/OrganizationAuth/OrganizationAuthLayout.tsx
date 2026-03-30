'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getBackgroundStyle, generateCSSVariables, hexToRgb } from '../../../business-panel/utils/styles';
import type { StyleConfig } from '../../../business-panel/hooks/useOrganizationStyles';

interface OrganizationAuthLayoutProps {
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
    description?: string | null;
    brand_color_primary?: string | null;
    brand_color_secondary?: string | null;
    brand_font_family?: string | null;
    brand_favicon_url?: string | null;
  };
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

import { useThemeStore } from '../../../../core/stores/themeStore';

export function OrganizationAuthLayout({
  organization,
  children,
  isLoading = false,
  error = null,
}: OrganizationAuthLayoutProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true; // Esperar a que se monte para evitar flash

  const faviconUrl = organization.brand_favicon_url || organization.logo_url || '/icono.png';
  const primaryColor = organization.brand_color_primary || '#3b82f6';
  const secondaryColor = organization.brand_color_secondary || '#10b981';
  const [loginStyles, setLoginStyles] = useState<StyleConfig | null>(null);

  // Obtener estilos de login desde la API
  useEffect(() => {
    const fetchLoginStyles = async () => {
      try {
        const slug = (organization as any).slug;
        if (!slug) return;

        const response = await fetch(`/api/organizations/${slug}/styles`, {
          credentials: 'include',
        });

        const data = await response.json();
        if (data.success && data.styles?.login) {
          setLoginStyles(data.styles.login);
        }
      } catch (error) {
      }
    };

    fetchLoginStyles();
  }, [organization]);

  // Aplicar estilos personalizados de login
  const backgroundStyle = getBackgroundStyle(loginStyles);
  const cssVariables = generateCSSVariables(loginStyles);

  // Usar colores de estilos personalizados si están disponibles
  const finalPrimaryColor = loginStyles?.primary_button_color || primaryColor;
  const finalSecondaryColor = loginStyles?.secondary_button_color || secondaryColor;
  
  // Calcular estilos de la tarjeta - Adaptativos
  const defaultCardBg = isDark ? '#1a1a2e' : 'rgba(255, 255, 255, 0.9)';
  const defaultText = isDark ? '#ffffff' : '#0f172a';
  const defaultBorder = isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)';
  const defaultPageBg = isDark ? '#0f172a' : '#f0f4f8';

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
  const pageBackground = !loginStyles?.background_image ? { backgroundColor: defaultPageBg } : {};

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-y-auto transition-all duration-500"
      style={{
        ...pageBackground,
        ...backgroundStyle,
        ...cssVariables,
        color: textColor // Asegurar que el texto herede el color correcto globalmente
      } as React.CSSProperties}
    >
      {/* Animated Gradient Orbs */}
      {!loginStyles?.background_type && (
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

      {/* Two-Column Layout Container */}
      <div className="w-full min-h-screen flex items-center justify-center p-4 lg:p-8 relative z-10 py-12 lg:py-0">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          
          {/* LEFT SIDE - 3D Floating Logo */}
          <motion.div
            className="flex-1 flex items-center justify-center relative w-full lg:w-auto mb-8 lg:mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Floating Animation Container */}
            <motion.div
              className="relative"
              animate={{
                y: [-10, 10, -10],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* 3D Logo Container - Clean */}
              <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] lg:w-[280px] lg:h-[280px] flex items-center justify-center">

                {/* Logo/Favicon - Center */}
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
                      sizes="(max-width: 768px) 240px, 400px"
                      priority
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/icono.png';
                      }}
                    />
                </motion.div>

                {/* Subtle Glow Effect behind logo */}
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none -z-10 blur-[60px]"
                  style={{
                    background: `radial-gradient(circle, ${finalPrimaryColor}40, transparent 70%)`,
                  }}
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - Login Form Panel */}
          <motion.div
            className="flex-1 w-full max-w-md lg:max-w-xl"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Login Card */}
            <div 
              className="relative backdrop-blur-xl p-6 lg:p-8 shadow-2xl rounded-3xl border overflow-hidden min-h-[300px] flex flex-col justify-center"
              style={{
                backgroundColor: cardBackgroundColor,
                borderColor: borderColor,
                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${borderColor}20`,
              }}
            >
              {/* Inner gradient overlay */}
              <motion.div 
                className="absolute inset-0 opacity-10 rounded-3xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${finalPrimaryColor}20, transparent, ${finalSecondaryColor}20)`,
                }}
              />

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, transparent 30%, ${finalPrimaryColor}20 50%, transparent 70%)`,
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
                        style={{ color: `${textColor}90` }}
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
                      Cargando...
                    </p>
                  </div>
                )} { /* ... existing error and content logic ... */ }

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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
