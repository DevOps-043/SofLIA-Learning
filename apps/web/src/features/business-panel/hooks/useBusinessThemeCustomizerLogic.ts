'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext';
import type { StyleConfig } from '../contexts/OrganizationStylesContext';
import { getAllThemes, ThemeConfig, generateBrandingTheme, BrandingColors } from '../config/preset-themes';

type ActivePanel = 'panel' | 'userDashboard' | 'login';

// Pure helper outside the hook – no hook-rule concerns
const getDefaultStyle = (): StyleConfig => ({
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e40af 100%)',
  primary_button_color: '#3b82f6',
  secondary_button_color: '#2563eb',
  accent_color: '#60a5fa',
  sidebar_background: '#1e293b',
  card_background: '#1e293b',
  text_color: '#f8fafc',
  border_color: '#334155',
  modal_opacity: 0.95,
  card_opacity: 1,
  sidebar_opacity: 1
});

export function useBusinessThemeCustomizerLogic() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;
  const { styles, loading, error, updateStyles, applyTheme, refetch } = useOrganizationStylesContext();

  const [activePanel, setActivePanel] = useState<ActivePanel>('panel');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [brandingColors, setBrandingColors] = useState<BrandingColors | null>(null);
  const [loadingBranding, setLoadingBranding] = useState(true);

  // Per-panel local style states
  const [panelStyles, setPanelStyles] = useState<StyleConfig | null>(() => getDefaultStyle());
  const [userDashboardStyles, setUserDashboardStyles] = useState<StyleConfig | null>(() => getDefaultStyle());
  const [loginStyles, setLoginStyles] = useState<StyleConfig | null>(() => getDefaultStyle());

  // Gradient visual selector state (must be declared before any conditional returns)
  const [copiedGradient, setCopiedGradient] = useState(false);
  const [discardChanges, setDiscardChanges] = useState(false);
  const [gradientColors, setGradientColors] = useState<string[]>(['#1e3a8a', '#1e40af']);
  const [gradientAngle, setGradientAngle] = useState<number>(135);

  // Sync local state whenever context styles change
  useEffect(() => {
    setPanelStyles(styles?.panel || getDefaultStyle());
    setUserDashboardStyles(styles?.userDashboard || getDefaultStyle());
    setLoginStyles(styles?.login || getDefaultStyle());

    const currentBgValue =
      activePanel === 'panel'
        ? (styles?.panel || getDefaultStyle()).background_value || ''
        : activePanel === 'userDashboard'
        ? (styles?.userDashboard || getDefaultStyle()).background_value || ''
        : (styles?.login || getDefaultStyle()).background_value || '';

    if (currentBgValue && currentBgValue.includes('linear-gradient')) {
      const match = currentBgValue.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
      if (match) {
        const angle = parseInt(match[1]) || 135;
        const colorsStr = match[2];
        const colorMatches = colorsStr.match(/#[0-9a-fA-F]{6}/g);
        if (colorMatches && colorMatches.length >= 2) {
          setGradientAngle(angle);
          setGradientColors(colorMatches);
        }
      }
    }
  }, [styles, activePanel]);

  // Fetch branding colors for auto-theme generation
  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        setLoadingBranding(true);
        const fetchUrl = orgSlug
          ? `/api/${orgSlug}/business/branding`
          : '/api/business/settings/branding';

        const response = await fetch(fetchUrl, { credentials: 'include' });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.branding) {
            setBrandingColors({
              color_primary: result.branding.color_primary,
              color_secondary: result.branding.color_secondary,
              color_accent: result.branding.color_accent
            });
          }
        }
      } catch (err) {
        console.error('Error fetching branding colors:', err);
      } finally {
        setLoadingBranding(false);
      }
    };

    fetchBrandingColors();
  }, []);

  // --- Derived values ---

  const currentStyles = useMemo(() => {
    const defaultStyle = getDefaultStyle();
    if (activePanel === 'panel') return panelStyles || defaultStyle;
    if (activePanel === 'userDashboard') return userDashboardStyles || defaultStyle;
    return loginStyles || defaultStyle;
  }, [activePanel, panelStyles, userDashboardStyles, loginStyles]);

  const allThemes = useMemo(() => {
    const presetThemes = getAllThemes();
    if (brandingColors && !loadingBranding) {
      const brandingTheme = generateBrandingTheme(brandingColors);
      return [...presetThemes, brandingTheme];
    }
    return presetThemes;
  }, [brandingColors, loadingBranding]);

  // --- Gradient helpers ---

  const generateGradientCSS = useCallback((): string => {
    if (gradientColors.length < 2) return 'linear-gradient(135deg, #1e3a8a, #1e40af)';
    const colorsWithStops = gradientColors
      .map((color, index) => {
        const stop = (index / (gradientColors.length - 1)) * 100;
        return `${color} ${stop}%`;
      })
      .join(', ');
    return `linear-gradient(${gradientAngle}deg, ${colorsWithStops})`;
  }, [gradientColors, gradientAngle]);

  // Sync gradient CSS into active panel background_value
  useEffect(() => {
    if (currentStyles.background_type === 'gradient' && gradientColors.length >= 2) {
      const newGradient = generateGradientCSS();
      const currentGradient = currentStyles.background_value || '';
      if (newGradient !== currentGradient) {
        updateStyle(activePanel, 'background_value', newGradient);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradientColors, gradientAngle, activePanel]);

  // --- Style mutation ---

  const updateStyle = (panel: ActivePanel, field: keyof StyleConfig, value: any) => {
    switch (panel) {
      case 'panel':
        setPanelStyles((prev) => ({ ...(prev || getDefaultStyle()), [field]: value }));
        break;
      case 'userDashboard':
        setUserDashboardStyles((prev) => ({ ...(prev || getDefaultStyle()), [field]: value }));
        break;
      case 'login':
        setLoginStyles((prev) => ({ ...(prev || getDefaultStyle()), [field]: value }));
        break;
    }
    setSaveSuccess(null);
    setSaveError(null);
  };

  // --- Action handlers ---

  const handleApplyTheme = async (themeId: string) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const success = await applyTheme(themeId);
      if (success) {
        setSaveSuccess('Tema aplicado correctamente');
        setTimeout(() => setSaveSuccess(null), 3000);
        await refetch();
      } else {
        setSaveError('Error al aplicar tema');
        setTimeout(() => setSaveError(null), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error al aplicar tema');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const success = await updateStyles(
        panelStyles || undefined,
        userDashboardStyles || undefined,
        loginStyles || undefined
      );

      if (success) {
        setSaveSuccess('Estilos guardados correctamente');
        setTimeout(() => setSaveSuccess(null), 3000);
        await refetch();
      } else {
        setSaveError('Error al guardar estilos');
        setTimeout(() => setSaveError(null), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar estilos');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (styles) {
      setPanelStyles(styles.panel || getDefaultStyle());
      setUserDashboardStyles(styles.userDashboard || getDefaultStyle());
      setLoginStyles(styles.login || getDefaultStyle());
      setSaveError(null);
      setSaveSuccess(null);
    }
  };

  const handleReset = () => {
    const defaultStyle = getDefaultStyle();
    setPanelStyles(defaultStyle);
    setUserDashboardStyles(defaultStyle);
    setLoginStyles(defaultStyle);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const copyGradientToClipboard = () => {
    const gradient = generateGradientCSS();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(gradient).then(() => {
        setCopiedGradient(true);
        setTimeout(() => setCopiedGradient(false), 2000);
      });
    }
  };

  const addGradientColor = () => {
    if (gradientColors.length < 5) {
      setGradientColors([...gradientColors, '#3b82f6']);
    }
  };

  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index));
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...gradientColors];
    newColors[index] = color;
    setGradientColors(newColors);
  };

  const getThemeIcon = (themeId: string) => {
    const icons: Record<string, string> = {
      'SOFLIA': 'T',
      'SOFLIA-predeterminado': 'T',
      'SOFLIA-claro': 'T',
      'corporativo-azul': 'A',
      'ejecutivo-oscuro': 'D',
      'premium-dorado': 'B',
      'elite-plateado': 'X',
      'flexibilidad-verde': 'E',
      'tecnologia-verde': 'B',
      'financiero-proceso': 'B',
      'recursos-procesado': 'K',
      'branding-personalizado': '★'
    };
    return icons[themeId] || 'T';
  };

  const getThemeColor = (theme: ThemeConfig) => {
    if (theme.id === 'branding-personalizado') {
      return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
    }
    return theme.panel.background_value;
  };

  const isThemeSelected = (themeId: string): boolean => {
    const selectedTheme = styles?.selectedTheme;
    if (!selectedTheme) return false;
    if (selectedTheme === themeId) return true;
    if (themeId === 'SOFLIA' && (selectedTheme === 'SOFLIA-predeterminado' || selectedTheme === 'SOFLIA-claro')) {
      return true;
    }
    return false;
  };

  return {
    // Context passthrough
    styles,
    loading,
    error,
    // Panel selector
    activePanel,
    setActivePanel,
    // Styles state
    currentStyles,
    panelStyles,
    userDashboardStyles,
    loginStyles,
    // Save state
    saveSuccess,
    saveError,
    isSaving,
    // Branding
    brandingColors,
    loadingBranding,
    // Themes
    allThemes,
    // Gradient
    gradientColors,
    gradientAngle,
    setGradientAngle,
    copiedGradient,
    discardChanges,
    generateGradientCSS,
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    copyGradientToClipboard,
    // Helpers
    getThemeIcon,
    getThemeColor,
    isThemeSelected,
    updateStyle,
    // Handlers
    handleApplyTheme,
    handleSave,
    handleDiscard,
    handleReset,
  };
}
