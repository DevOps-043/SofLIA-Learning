'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext';
import type { StyleConfig } from '../contexts/OrganizationStylesContext';
import { BrandingColors, ThemeConfig, generateBrandingTheme, getAllThemes } from '../config/preset-themes';
import {
  type ActivePanel,
  buildGradientCss,
  getBusinessThemeIcon,
  getBusinessThemePreview,
  getDefaultBusinessStyle,
  matchesBusinessTheme,
  parseGradientStyleValue,
} from '../services/business-theme-customizer.service';

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

  const [panelStyles, setPanelStyles] = useState<StyleConfig | null>(() => getDefaultBusinessStyle());
  const [userDashboardStyles, setUserDashboardStyles] = useState<StyleConfig | null>(() =>
    getDefaultBusinessStyle()
  );
  const [loginStyles, setLoginStyles] = useState<StyleConfig | null>(() => getDefaultBusinessStyle());

  const [copiedGradient, setCopiedGradient] = useState(false);
  const [gradientColors, setGradientColors] = useState<string[]>(['#1e3a8a', '#1e40af']);
  const [gradientAngle, setGradientAngle] = useState(135);

  useEffect(() => {
    setPanelStyles(styles?.panel || getDefaultBusinessStyle());
    setUserDashboardStyles(styles?.userDashboard || getDefaultBusinessStyle());
    setLoginStyles(styles?.login || getDefaultBusinessStyle());

    const currentBgValue =
      activePanel === 'panel'
        ? (styles?.panel || getDefaultBusinessStyle()).background_value || ''
        : activePanel === 'userDashboard'
          ? (styles?.userDashboard || getDefaultBusinessStyle()).background_value || ''
          : (styles?.login || getDefaultBusinessStyle()).background_value || '';

    const parsedGradient = parseGradientStyleValue(currentBgValue);
    if (parsedGradient) {
      setGradientAngle(parsedGradient.angle);
      setGradientColors(parsedGradient.colors);
    }
  }, [activePanel, styles]);

  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        setLoadingBranding(true);
        const fetchUrl = orgSlug
          ? `/api/${orgSlug}/business/branding`
          : '/api/business/settings/branding';

        const response = await fetch(fetchUrl, { credentials: 'include' });
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        if (result.success && result.branding) {
          setBrandingColors({
            color_primary: result.branding.color_primary,
            color_secondary: result.branding.color_secondary,
            color_accent: result.branding.color_accent,
          });
        }
      } catch {
        // Silent fallback: the user can still work with preset themes.
      } finally {
        setLoadingBranding(false);
      }
    };

    void fetchBrandingColors();
  }, [orgSlug]);

  const currentStyles = useMemo(() => {
    const defaultStyle = getDefaultBusinessStyle();
    if (activePanel === 'panel') {
      return panelStyles || defaultStyle;
    }
    if (activePanel === 'userDashboard') {
      return userDashboardStyles || defaultStyle;
    }
    return loginStyles || defaultStyle;
  }, [activePanel, loginStyles, panelStyles, userDashboardStyles]);

  const allThemes = useMemo(() => {
    const presetThemes = getAllThemes();
    if (brandingColors && !loadingBranding) {
      return [...presetThemes, generateBrandingTheme(brandingColors)];
    }
    return presetThemes;
  }, [brandingColors, loadingBranding]);

  const generateGradientCSS = useCallback(() => {
    return buildGradientCss(gradientColors, gradientAngle);
  }, [gradientAngle, gradientColors]);

  const updateStyle = useCallback(
    (panel: ActivePanel, field: keyof StyleConfig, value: StyleConfig[keyof StyleConfig]) => {
      switch (panel) {
        case 'panel':
          setPanelStyles((prev) => ({ ...(prev || getDefaultBusinessStyle()), [field]: value }));
          break;
        case 'userDashboard':
          setUserDashboardStyles((prev) => ({
            ...(prev || getDefaultBusinessStyle()),
            [field]: value,
          }));
          break;
        case 'login':
          setLoginStyles((prev) => ({ ...(prev || getDefaultBusinessStyle()), [field]: value }));
          break;
      }

      setSaveSuccess(null);
      setSaveError(null);
    },
    []
  );

  useEffect(() => {
    if (currentStyles.background_type !== 'gradient' || gradientColors.length < 2) {
      return;
    }

    const nextGradient = generateGradientCSS();
    if (nextGradient !== currentStyles.background_value) {
      updateStyle(activePanel, 'background_value', nextGradient);
    }
  }, [activePanel, currentStyles.background_type, currentStyles.background_value, generateGradientCSS, gradientColors.length, updateStyle]);

  const clearSaveState = () => {
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleApplyTheme = async (themeId: string) => {
    setIsSaving(true);
    clearSaveState();

    try {
      const success = await applyTheme(themeId);
      if (success) {
        setSaveSuccess('Tema aplicado correctamente');
        setTimeout(() => setSaveSuccess(null), 3000);
        await refetch();
        return;
      }

      setSaveError('Error al aplicar tema');
      setTimeout(() => setSaveError(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al aplicar tema';
      setSaveError(message);
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    clearSaveState();

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
        return;
      }

      setSaveError('Error al guardar estilos');
      setTimeout(() => setSaveError(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar estilos';
      setSaveError(message);
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!styles) {
      return;
    }

    setPanelStyles(styles.panel || getDefaultBusinessStyle());
    setUserDashboardStyles(styles.userDashboard || getDefaultBusinessStyle());
    setLoginStyles(styles.login || getDefaultBusinessStyle());
    clearSaveState();
  };

  const handleReset = () => {
    const defaultStyle = getDefaultBusinessStyle();
    setPanelStyles(defaultStyle);
    setUserDashboardStyles(defaultStyle);
    setLoginStyles(defaultStyle);
    clearSaveState();
  };

  const copyGradientToClipboard = () => {
    const gradient = generateGradientCSS();
    if (!navigator.clipboard?.writeText) {
      return;
    }

    void navigator.clipboard.writeText(gradient).then(() => {
      setCopiedGradient(true);
      setTimeout(() => setCopiedGradient(false), 2000);
    });
  };

  const addGradientColor = () => {
    if (gradientColors.length < 5) {
      setGradientColors((prev) => [...prev, '#3b82f6']);
    }
  };

  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors((prev) => prev.filter((_, colorIndex) => colorIndex !== index));
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    setGradientColors((prev) => {
      const nextColors = [...prev];
      nextColors[index] = color;
      return nextColors;
    });
  };

  const getThemeIcon = (themeId: string) => getBusinessThemeIcon(themeId);
  const getThemeColor = (theme: ThemeConfig) => getBusinessThemePreview(theme);
  const isThemeSelected = (themeId: string) => matchesBusinessTheme(styles?.selectedTheme, themeId);

  return {
    styles,
    loading,
    error,
    activePanel,
    setActivePanel,
    currentStyles,
    panelStyles,
    userDashboardStyles,
    loginStyles,
    saveSuccess,
    saveError,
    isSaving,
    brandingColors,
    loadingBranding,
    allThemes,
    gradientColors,
    gradientAngle,
    setGradientAngle,
    copiedGradient,
    generateGradientCSS,
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    copyGradientToClipboard,
    getThemeIcon,
    getThemeColor,
    isThemeSelected,
    updateStyle,
    handleApplyTheme,
    handleSave,
    handleDiscard,
    handleReset,
  };
}
