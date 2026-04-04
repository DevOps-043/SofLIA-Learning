'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PRESET_THEMES, DEFAULT_THEME, getThemeStylesForMode } from '../config/preset-themes';
import { useThemeStore } from '@/core/stores/themeStore';

// Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log : () => { };

export interface StyleConfig {
  background_type: 'image' | 'color' | 'gradient';
  background_value: string;
  primary_button_color: string;
  secondary_button_color: string;
  accent_color: string;
  sidebar_background: string;
  card_background: string;
  text_color?: string;
  border_color?: string;
  modal_opacity?: number; // 0 (transparente) a 1 (opaco)
  card_opacity?: number; // 0 (transparente) a 1 (opaco)
  sidebar_opacity?: number; // 0 (transparente) a 1 (opaco)
}

export interface OrganizationStyles {
  panel: StyleConfig | null;
  userDashboard: StyleConfig | null;
  login: StyleConfig | null;
  selectedTheme: string | null;
  // Indica si el tema actual soporta modo dual (claro/oscuro)
  supportsDualMode?: boolean;
}

interface OrganizationStylesContextType {
  styles: OrganizationStyles | null;
  // Estilos efectivos según el modo actual del usuario (light/dark)
  effectiveStyles: OrganizationStyles | null;
  loading: boolean;
  error: string | null;
  updateStyles: (panel?: StyleConfig, userDashboard?: StyleConfig, login?: StyleConfig) => Promise<boolean>;
  applyTheme: (themeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const OrganizationStylesContext = createContext<OrganizationStylesContextType | undefined>(undefined);

export function OrganizationStylesProvider({ children, orgSlug }: { children: ReactNode, orgSlug?: string }) {
  const { user } = useAuth();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [styles, setStyles] = useState<OrganizationStyles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache para evitar recálculos innecesarios
  const effectiveStylesCache = useRef<{
    styles: OrganizationStyles | null;
    theme: string;
    result: OrganizationStyles | null;
  }>({ styles: null, theme: '', result: null });

  // Calcular estilos efectivos basados en el modo de tema actual
  // OPTIMIZADO: Usa cache para evitar crear nuevos objetos innecesariamente
  const effectiveStyles = useMemo<OrganizationStyles | null>(() => {
    if (!styles) return null;

    // Verificar si podemos usar el cache
    const cache = effectiveStylesCache.current;
    if (cache.styles === styles && cache.theme === resolvedTheme && cache.result) {
      return cache.result;
    }

    let result: OrganizationStyles;

    // Si el tema soporta modo dual, obtener los estilos para el modo actual
    if (styles.supportsDualMode && styles.selectedTheme) {
      const modeStyles = getThemeStylesForMode(styles.selectedTheme, resolvedTheme);
      if (modeStyles) {
        result = {
          ...styles,
          panel: modeStyles.panel,
          userDashboard: modeStyles.userDashboard,
          login: modeStyles.login,
        };
      } else {
        result = styles;
      }
    } else if (resolvedTheme === 'light') {
      // Si no soporta modo dual pero estamos en modo claro,
      // usar el lightMode del tema por defecto como fallback
      const defaultLightStyles = getThemeStylesForMode(DEFAULT_THEME, 'light');
      if (defaultLightStyles) {
        result = {
          ...styles,
          panel: defaultLightStyles.panel,
          userDashboard: defaultLightStyles.userDashboard,
          login: defaultLightStyles.login,
        };
      } else {
        result = styles;
      }
    } else {
      // Modo oscuro sin tema dual: retornar los estilos tal cual
      result = styles;
    }

    // Actualizar cache
    effectiveStylesCache.current = { styles, theme: resolvedTheme, result };
    return result;
  }, [styles, resolvedTheme]);

  // Memoizar fetchStyles para evitar recreaciones
  // OPTIMIZADO: Carga instantánea desde cache, luego revalida en background
  const fetchStyles = useCallback(async () => {
    // Si es Administrador sin organización, usar tema por defecto sin llamar a la API
    const normalizedRole = user?.cargo_rol?.toLowerCase().trim() || '';
    const isAdmin = normalizedRole === 'administrador';

    if (isAdmin && !user?.organization_id) {
      const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
      if (defaultTheme) {
        setStyles({
          panel: defaultTheme.panel,
          userDashboard: defaultTheme.userDashboard,
          login: defaultTheme.login,
          selectedTheme: DEFAULT_THEME,
          supportsDualMode: defaultTheme.supportsDualMode
        });
      }
      setLoading(false);
      return;
    }

    if (!user?.organization_id) {
      // Aplicar tema por defecto cuando no hay organization_id
      const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
      if (defaultTheme) {
        setStyles({
          panel: defaultTheme.panel,
          userDashboard: defaultTheme.userDashboard,
          login: defaultTheme.login,
          selectedTheme: DEFAULT_THEME,
          supportsDualMode: defaultTheme.supportsDualMode
        });
      }
      setLoading(false);
      return;
    }

    // OPTIMIZACIÓN: Cargar PRIMERO desde cache para mostrar UI instantáneamente
    const cacheKey = `business-theme-${user.organization_id}`;
    let cachedStyles: OrganizationStyles | null = null;

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          cachedStyles = JSON.parse(cached);
          // Mostrar cache inmediatamente (UI instantánea)
          setStyles(cachedStyles);
          setLoading(false); // Ya tenemos datos, no mostrar loading
          log('📦 Estilos cargados desde cache instantáneamente');
        }
      } catch (e) {
        // Cache inválido, continuar con fetch
      }
    }

    // Si no hay cache, mostrar loading
    if (!cachedStyles) {
      setLoading(true);
    }

    // Revalidar desde servidor en background (stale-while-revalidate pattern)
    try {
      setError(null);

      const fetchUrl = orgSlug 
        ? `/api/${orgSlug}/business/styles`
        : `/api/${user.organization_id}/business/styles`; // Fallback a ID si no hay slug, pero siempre org-scoped

      const response = await fetch(fetchUrl, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener estilos');
      }

      // Si los estilos están vacíos, usar tema por defecto
      if (!data.styles?.panel && !data.styles?.selectedTheme) {
        const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
        if (defaultTheme) {
          const defaultStyles: OrganizationStyles = {
            panel: defaultTheme.panel,
            userDashboard: defaultTheme.userDashboard,
            login: defaultTheme.login,
            selectedTheme: DEFAULT_THEME,
            supportsDualMode: defaultTheme.supportsDualMode
          };
          setStyles(defaultStyles);
          // Guardar en cache
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(defaultStyles));
            } catch (e) { /* ignore */ }
          }
          return;
        }
      }

      // Solo actualizar si los datos son diferentes (evitar re-renders innecesarios)
      const newStylesStr = JSON.stringify(data.styles);
      const cachedStylesStr = cachedStyles ? JSON.stringify(cachedStyles) : null;

      if (newStylesStr !== cachedStylesStr) {
        setStyles(data.styles);
        log('🔄 Estilos actualizados desde servidor');
      }

      // Guardar en localStorage
      if (typeof window !== 'undefined' && data.styles) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data.styles));
        } catch (e) {
          // Silenciar error de localStorage
        }
      }
    } catch (err: unknown) {
      // Si ya teníamos cache, no mostrar error (datos ya están en pantalla)
      if (!cachedStyles) {
        setError(err instanceof Error ? err.message : 'Error al obtener estilos');

        // Sin cache, usar tema por defecto
        const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
        if (defaultTheme) {
          setStyles({
            panel: defaultTheme.panel,
            userDashboard: defaultTheme.userDashboard,
            login: defaultTheme.login,
            selectedTheme: DEFAULT_THEME,
            supportsDualMode: defaultTheme.supportsDualMode
          });
        } else {
          setStyles(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.organization_id, user?.cargo_rol]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const updateStyles = async (
    panel?: StyleConfig,
    userDashboard?: StyleConfig,
    login?: StyleConfig
  ): Promise<boolean> => {
    try {
      const organizationId = user?.organization_id;
      if (!orgSlug && !organizationId) {
        setError('No se encontró la organización del usuario');
        return false;
      }

      const updateData: Partial<Pick<OrganizationStyles, 'panel' | 'userDashboard' | 'login'>> = {};
      if (panel !== undefined) updateData.panel = panel;
      if (userDashboard !== undefined) updateData.userDashboard = userDashboard;
      if (login !== undefined) updateData.login = login;


      const fetchUrl = orgSlug 
        ? `/api/${orgSlug}/business/styles`
        : `/api/${organizationId}/business/styles`;

      const response = await fetch(fetchUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar estilos');
      }

      setStyles(data.styles);

      // Guardar en localStorage
      if (typeof window !== 'undefined' && user?.organization_id && data.styles) {
        try {
          localStorage.setItem(
            `business-theme-${user.organization_id}`,
            JSON.stringify(data.styles)
          );
        } catch (e) {
          console.error('Error guardando tema en localStorage:', e);
        }
      }

      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estilos');
      return false;
    }
  };

  const applyTheme = async (themeId: string): Promise<boolean> => {
    try {
      const organizationId = user?.organization_id;
      if (!orgSlug && !organizationId) {
        setError('No se encontró la organización del usuario');
        return false;
      }

      const fetchUrl = orgSlug 
        ? `/api/${orgSlug}/business/styles`
        : `/api/${organizationId}/business/styles`;

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ themeId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al aplicar tema');
      }

      setStyles(data.styles);

      // Guardar en localStorage
      if (typeof window !== 'undefined' && user?.organization_id && data.styles) {
        try {
          localStorage.setItem(
            `business-theme-${user.organization_id}`,
            JSON.stringify(data.styles)
          );
        } catch (e) {
          console.error('Error guardando tema en localStorage:', e);
        }
      }

      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al aplicar tema');
      return false;
    }
  };

  const refetch = async () => {
    await fetchStyles();
  };

  return (
    <OrganizationStylesContext.Provider value={{ styles, effectiveStyles, loading, error, updateStyles, applyTheme, refetch }}>
      {children}
    </OrganizationStylesContext.Provider>
  );
}

export function useOrganizationStylesContext() {
  const context = useContext(OrganizationStylesContext);
  if (context === undefined) {
    throw new Error('useOrganizationStylesContext must be used within OrganizationStylesProvider');
  }
  return context;
}
