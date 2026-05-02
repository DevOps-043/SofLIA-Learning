import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '../../../core/stores/themeStore';
import { useOrganizationStore } from '../../../core/stores/organizationStore';
import { getThemeStylesForMode } from '../config/preset-themes';
import { useOptionalOrganizationStylesContext } from '../contexts/OrganizationStylesContext';

export interface OrganizationStyles {
  panel: StyleConfig | null;
  userDashboard: StyleConfig | null;
  login: StyleConfig | null;
  selectedTheme: string | null;
  supportsDualMode?: boolean;
}

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

const getErrorMessage = (error: unknown, fallback: string): string => (
  error instanceof Error ? error.message : fallback
)

/**
 * Hook para obtener y actualizar los estilos de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 * Fallback: Si no hay orgSlug en la URL, intenta usar el slug
 * de la organización actual del store.
 */
export function useOrganizationStyles() {
  const contextStyles = useOptionalOrganizationStylesContext();
  const shouldUseContextStyles = contextStyles !== null;
  const params = useParams();
  const urlOrgSlug = params?.orgSlug as string | undefined;
  
  // Usar el slug del store como fallback
  const currentOrgSlug = useOrganizationStore(
    (state: ReturnType<typeof useOrganizationStore.getState>) => state.currentOrganization?.slug
  );
  const orgSlug = urlOrgSlug || currentOrgSlug;

  const resolvedTheme = useThemeStore(
    (state: ReturnType<typeof useThemeStore.getState>) => state.resolvedTheme
  );
  const [styles, setStyles] = useState<OrganizationStyles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcular estilos efectivos según el modo del tema
  const effectiveStyles = useMemo<OrganizationStyles | null>(() => {
    // Si el tema soporta modo dual, SIEMPRE obtener los estilos del preset según el modo actual
    if (styles?.supportsDualMode && styles?.selectedTheme) {
      const modeStyles = getThemeStylesForMode(styles.selectedTheme, resolvedTheme);
      if (modeStyles) {
        return {
          ...styles,
          panel: modeStyles.panel,
          userDashboard: modeStyles.userDashboard,
          login: modeStyles.login,
        };
      }
    }

    // Si styles es null pero tenemos tema por defecto, usar SOFLIA con el modo actual
    if (!styles) {
      const defaultModeStyles = getThemeStylesForMode('SOFLIA', resolvedTheme);
      if (defaultModeStyles) {
        return {
          panel: defaultModeStyles.panel,
          userDashboard: defaultModeStyles.userDashboard,
          login: defaultModeStyles.login,
          selectedTheme: 'SOFLIA',
          supportsDualMode: true,
        };
      }
      return null;
    }

    // Si no soporta modo dual pero estamos en modo claro,
    // usar el lightMode del tema por defecto como fallback para los fondos
    if (resolvedTheme === 'light') {
      const defaultLightStyles = getThemeStylesForMode('SOFLIA', 'light');
      if (defaultLightStyles) {
        return {
          ...styles,
          panel: defaultLightStyles.panel,
          userDashboard: defaultLightStyles.userDashboard,
          login: defaultLightStyles.login,
        };
      }
    }

    // Si no soporta modo dual (y está en modo oscuro), retornar los estilos tal cual
    return styles;
  }, [styles, resolvedTheme]);

  const fetchStyles = useCallback(async () => {
    if (shouldUseContextStyles) {
      return;
    }

    if (!orgSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/styles`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener estilos');
      }

      setStyles(data.styles);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al obtener estilos'));
      setStyles(null);
    } finally {
      setLoading(false);
    }
  }, [orgSlug, shouldUseContextStyles]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const updateStyles = useCallback(async (
    panel?: StyleConfig,
    userDashboard?: StyleConfig,
    login?: StyleConfig
  ): Promise<boolean> => {
    if (contextStyles) {
      return contextStyles.updateStyles(panel, userDashboard, login);
    }

    if (!orgSlug) {
      setError('No se pudo determinar la organización');
      return false;
    }

    try {
      const updateData: Record<string, unknown> = {};
      if (panel !== undefined) updateData.panel = panel;
      if (userDashboard !== undefined) updateData.userDashboard = userDashboard;
      if (login !== undefined) updateData.login = login;

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/styles`, {
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
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al actualizar estilos'));
      return false;
    }
  }, [contextStyles, orgSlug]);

  const applyTheme = useCallback(async (themeId: string): Promise<boolean> => {
    if (contextStyles) {
      return contextStyles.applyTheme(themeId);
    }

    if (!orgSlug) {
      setError('No se pudo determinar la organización');
      return false;
    }

    try {
      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/styles`, {
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
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al aplicar tema'));
      return false;
    }
  }, [contextStyles, orgSlug]);

  if (contextStyles) {
    return {
      styles: contextStyles.styles,
      effectiveStyles: contextStyles.effectiveStyles,
      loading: contextStyles.loading,
      error: contextStyles.error,
      updateStyles,
      applyTheme,
      refetch: contextStyles.refetch,
    };
  }

  return {
    styles,
    effectiveStyles,
    loading,
    error,
    updateStyles,
    applyTheme,
    refetch: fetchStyles,
  };
}
