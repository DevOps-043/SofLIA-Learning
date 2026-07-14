'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useThemeStore } from '@/core/stores/themeStore';
import { BRANDING_THEME_ID } from '@/core/theme/organization-branding-theme';
import { logger as techDebtLogger } from '@/lib/utils/logger';
import { DEFAULT_THEME, PRESET_THEMES, getThemeStylesForMode } from '../config/preset-themes';
import {
  clearLegacyOrganizationStylesCache,
  readOrganizationStylesCache,
  writeOrganizationStylesCache,
} from '../services/organization-styles-cache.service';
import { generateCSSVariables } from '../utils/styles';

const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? techDebtLogger.log.bind(techDebtLogger) : () => {};

const NON_ORG_ROUTE_SEGMENTS = new Set([
  'api',
  'auth',
  '_next',
  'public',
  'courses',
  'profile',
  'settings',
  'communities',
  'news',
  'admin',
  'instructor',
  'business-panel',
  'business-user',
  'dashboard',
  'certificates',
  'study-planner',
  'account-settings',
]);

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
  modal_opacity?: number;
  card_opacity?: number;
  sidebar_opacity?: number;
}

export interface OrganizationStyles {
  panel: StyleConfig | null;
  userDashboard: StyleConfig | null;
  login: StyleConfig | null;
  selectedTheme: string | null;
  supportsDualMode?: boolean;
  lightMode?: {
    panel: StyleConfig;
    userDashboard: StyleConfig;
    login: StyleConfig;
  };
}

function isOrgScopedPath(pathname: string | null): boolean {
  const firstSegment = pathname?.split('/').filter(Boolean)[0];
  return Boolean(firstSegment && !NON_ORG_ROUTE_SEGMENTS.has(firstSegment));
}

function isGlobalAdminPath(pathname: string | null): boolean {
  return pathname?.split('/').filter(Boolean)[0] === 'admin';
}

function getDefaultOrganizationStyles(): OrganizationStyles | null {
  const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
  if (!defaultTheme) return null;

  return {
    panel: defaultTheme.panel,
    userDashboard: defaultTheme.userDashboard,
    login: defaultTheme.login,
    selectedTheme: DEFAULT_THEME,
    supportsDualMode: defaultTheme.supportsDualMode,
    lightMode: defaultTheme.lightMode,
  };
}

interface OrganizationStylesContextType {
  styles: OrganizationStyles | null;
  effectiveStyles: OrganizationStyles | null;
  loading: boolean;
  error: string | null;
  updateStyles: (panel?: StyleConfig, userDashboard?: StyleConfig, login?: StyleConfig) => Promise<boolean>;
  applyTheme: (themeId: string) => Promise<boolean>;
  syncStyles: (nextStyles: OrganizationStyles | null) => void;
  refetch: () => Promise<void>;
}

const OrganizationStylesContext = createContext<OrganizationStylesContextType | undefined>(undefined);

export function OrganizationStylesProvider(props: {
  children: ReactNode;
  orgSlug?: string;
  initialStyles?: OrganizationStyles | null;
}) {
  const parentContext = useContext(OrganizationStylesContext);

  if (parentContext && !props.orgSlug) {
    return <>{props.children}</>;
  }

  return <OrganizationStylesProviderInner {...props} />;
}

function OrganizationStylesProviderInner({
  children,
  orgSlug,
  initialStyles,
}: {
  children: ReactNode;
  orgSlug?: string;
  initialStyles?: OrganizationStyles | null;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [styles, setStyles] = useState<OrganizationStyles | null>(initialStyles ?? null);
  const [loading, setLoading] = useState(initialStyles == null);
  const [error, setError] = useState<string | null>(null);
  const cacheScope = orgSlug || user?.organization_id || null;

  const effectiveStylesCache = useRef<{
    styles: OrganizationStyles | null;
    theme: string;
    result: OrganizationStyles | null;
  }>({ styles: null, theme: '', result: null });

  const syncStyles = useCallback((nextStyles: OrganizationStyles | null) => {
    setStyles(nextStyles);

    if (nextStyles) {
      writeOrganizationStylesCache(cacheScope, nextStyles);
      clearLegacyOrganizationStylesCache(user?.organization_id);
    }
  }, [cacheScope, user?.organization_id]);

  // When the server already injected brand styles, always write them to cache so
  // any stale defaults from a previous session don't survive to the next mount.
  // This prevents fetchStyles from reading old SOFLIA-preset cache and overwriting
  // the correct server-computed branding colours with teal/navy defaults.
  useEffect(() => {
    if (initialStyles && cacheScope) {
      writeOrganizationStylesCache(cacheScope, initialStyles);
    }
  // Run only on mount — cacheScope and initialStyles are stable after mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveStyles = useMemo<OrganizationStyles | null>(() => {
    if (!styles) return null;

    const cache = effectiveStylesCache.current;
    if (cache.styles === styles && cache.theme === resolvedTheme && cache.result) {
      return cache.result;
    }

    let result: OrganizationStyles;

    if (styles.selectedTheme === BRANDING_THEME_ID && styles.lightMode) {
      result = resolvedTheme === 'light'
        ? {
            ...styles,
            panel: styles.lightMode.panel,
            userDashboard: styles.lightMode.userDashboard,
            login: styles.lightMode.login,
          }
        : styles;
    } else if (styles.supportsDualMode && styles.selectedTheme) {
      const modeStyles = getThemeStylesForMode(styles.selectedTheme, resolvedTheme);
      result = modeStyles
        ? {
            ...styles,
            panel: modeStyles.panel,
            userDashboard: modeStyles.userDashboard,
            login: modeStyles.login,
          }
        : styles;
    } else if (resolvedTheme === 'light') {
      const defaultLightStyles = getThemeStylesForMode(DEFAULT_THEME, 'light');
      result = defaultLightStyles
        ? {
            ...styles,
            panel: defaultLightStyles.panel,
            userDashboard: defaultLightStyles.userDashboard,
            login: defaultLightStyles.login,
          }
        : styles;
    } else {
      result = styles;
    }

    effectiveStylesCache.current = { styles, theme: resolvedTheme, result };
    return result;
  }, [styles, resolvedTheme]);

  const fetchStyles = useCallback(async () => {
    if (isGlobalAdminPath(pathname)) {
      syncStyles(getDefaultOrganizationStyles());
      setLoading(false);
      return;
    }

    // Skip fetch for non-org routes that have no orgSlug and no fallback organization.
    // isOrgScopedPath returns FALSE for known non-org routes (/dashboard, /courses, etc.)
    // and TRUE for /{orgSlug}/... routes. The condition was previously inverted — fixed here.
    if (!orgSlug && !user?.organization_id && !isOrgScopedPath(pathname)) {
      syncStyles(getDefaultOrganizationStyles());
      setLoading(false);
      return;
    }

    // If we have no orgSlug but we're on an org-scoped path, there's nothing we can fetch
    // without the slug. Use defaults and let the inner context (OrganizationLayoutClient)
    // with the correct orgSlug take over.
    if (!orgSlug && !user?.organization_id) {
      syncStyles(getDefaultOrganizationStyles());
      setLoading(false);
      return;
    }

    clearLegacyOrganizationStylesCache(user?.organization_id);

    const cachedStyles = readOrganizationStylesCache(cacheScope);
    if (cachedStyles) {
      setStyles(cachedStyles);
      setLoading(false);
      log('Organization styles loaded from cache');
    } else {
      setLoading(true);
    }

    try {
      setError(null);

      const fetchUrl = orgSlug
        ? `/api/${orgSlug}/business/styles`
        : `/api/${user?.organization_id}/business/styles`;

      const response = await fetch(fetchUrl, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener estilos');
      }

      const nextStyles = data.styles?.panel || data.styles?.selectedTheme
        ? data.styles as OrganizationStyles
        : getDefaultOrganizationStyles();

      const nextStylesStr = JSON.stringify(nextStyles);
      const cachedStylesStr = cachedStyles ? JSON.stringify(cachedStyles) : null;

      if (nextStylesStr !== cachedStylesStr) {
        syncStyles(nextStyles);
        log('Organization styles refreshed from server');
      } else if (nextStyles) {
        writeOrganizationStylesCache(cacheScope, nextStyles);
      }
    } catch (err: unknown) {
      if (!cachedStyles) {
        setError(err instanceof Error ? err.message : 'Error al obtener estilos');
        syncStyles(getDefaultOrganizationStyles());
      }
    } finally {
      setLoading(false);
    }
  }, [
    cacheScope,
    orgSlug,
    pathname,
    syncStyles,
    user?.platform_role,
    user?.organization_id,
  ]);

  // Skip the client-side fetch when the server has already injected the correct
  // brand styles via `initialStyles`. Re-fetching would only open a race window
  // where stale cache or a failed request replaces the server-accurate data with
  // SOFLIA preset defaults. `refetch()` is still available for explicit refresh
  // (e.g. after the admin saves new branding in the same session).
  useEffect(() => {
    if (!initialStyles) {
      fetchStyles();
    }
  }, [fetchStyles, initialStyles]);

  const updateStyles = async (
    panel?: StyleConfig,
    userDashboard?: StyleConfig,
    login?: StyleConfig
  ): Promise<boolean> => {
    try {
      const organizationId = user?.organization_id;
      if (!orgSlug && !organizationId) {
        setError('No se encontro la organizacion del usuario');
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

      syncStyles(data.styles as OrganizationStyles);
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
        setError('No se encontro la organizacion del usuario');
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

      syncStyles(data.styles as OrganizationStyles);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al aplicar tema');
      return false;
    }
  };

  const refetch = async () => {
    await fetchStyles();
  };

  const value = useMemo<OrganizationStylesContextType>(() => ({
    styles,
    effectiveStyles,
    loading,
    error,
    updateStyles,
    applyTheme,
    syncStyles,
    refetch,
  }), [styles, effectiveStyles, loading, error, updateStyles, applyTheme, syncStyles, refetch]);

  return (
    <OrganizationStylesContext.Provider value={value}>
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

export function useOptionalOrganizationStylesContext() {
  return useContext(OrganizationStylesContext) ?? null;
}

/**
 * Injects --org-* CSS custom properties onto document.documentElement so that
 * ALL elements on the page (including portals rendered into document.body, course
 * learn pages, and any other global UI) can consume org brand colors via CSS vars.
 *
 * Must be rendered as a child of OrganizationStylesProvider.
 * Cleans up variables when unmounted (user leaves the org route).
 */
export function OrganizationGlobalCSSInjector() {
  const ctx = useContext(OrganizationStylesContext);
  const panelStyles = ctx?.effectiveStyles?.panel ?? null;

  useEffect(() => {
    if (!panelStyles) return;

    const vars = generateCSSVariables(panelStyles);
    const root = document.documentElement;

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    return () => {
      Object.keys(vars).forEach((key) => root.style.removeProperty(key));
    };
  }, [panelStyles]);

  return null;
}
