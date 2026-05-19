import { DESIGN_HEX_COLOR } from "@/core/theme/color-tokens";

export interface ThemeStyle {
  background_type: "image" | "color" | "gradient";
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

// Configuración de estilos para modo específico (light o dark)
export interface ThemeModeStyles {
  panel: ThemeStyle;
  userDashboard: ThemeStyle;
  login: ThemeStyle;
}

// Nueva interfaz para temas con soporte dual de modo claro/oscuro
export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  // Soporte para dual mode (modo claro y oscuro en un solo tema)
  supportsDualMode?: boolean;
  // Estilos para modo oscuro (por defecto o único modo)
  panel: ThemeStyle;
  userDashboard: ThemeStyle;
  login: ThemeStyle;
  // Estilos opcionales para modo claro (solo si supportsDualMode es true)
  lightMode?: ThemeModeStyles;
}

export interface BrandingColors {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
}

/**
 * Función auxiliar para oscurecer un color hexadecimal
 */
function darkenColor(hex: string, percent: number): string {
  // Remover el # si existe
  hex = hex.replace("#", "");

  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Oscurecer
  const newR = Math.floor(r * (1 - percent));
  const newG = Math.floor(g * (1 - percent));
  const newB = Math.floor(b * (1 - percent));

  // Convertir de vuelta a hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Genera un tema automáticamente desde los colores de Branding
 */
export function generateBrandingTheme(branding: BrandingColors): ThemeConfig {
  const darkPrimary = darkenColor(branding.color_primary, 0.7);
  const mediumPrimary = darkenColor(branding.color_primary, 0.5);
  const lightPrimary = darkenColor(branding.color_primary, 0.3);

  return {
    id: "branding-personalizado",
    name: "Branding Personalizado",
    description: "Tema generado automáticamente con los colores de tu marca",
    panel: {
      background_type: "gradient",
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${mediumPrimary} 50%, ${lightPrimary} 100%)`,
      primary_button_color: branding.color_primary,
      secondary_button_color: branding.color_secondary,
      accent_color: branding.color_accent,
      sidebar_background: darkPrimary,
      card_background: darkPrimary,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98,
    },
    userDashboard: {
      background_type: "gradient",
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${mediumPrimary} 50%, ${lightPrimary} 100%)`,
      primary_button_color: branding.color_primary,
      secondary_button_color: branding.color_secondary,
      accent_color: branding.color_accent,
      sidebar_background: darkPrimary,
      card_background: darkPrimary,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98,
    },
    login: {
      background_type: "gradient",
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${lightPrimary} 100%)`,
      primary_button_color: branding.color_primary,
      secondary_button_color: branding.color_secondary,
      accent_color: branding.color_accent,
      sidebar_background: "transparent",
      card_background: DESIGN_HEX_COLOR.slate800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1,
    },
  };
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  // SofLIA - Tema oficial unificado con soporte para modo claro y oscuro
  SOFLIA: {
    id: "SOFLIA",
    name: "SofLIA",
    description:
      "Tema oficial basado en el Sistema de Diseño SofLIA con soporte para modo claro y oscuro",
    supportsDualMode: true,
    // Modo oscuro (configuración por defecto)
    panel: {
      background_type: "color",
      background_value: DESIGN_HEX_COLOR.bgDark,
      primary_button_color: DESIGN_HEX_COLOR.primary,
      secondary_button_color: DESIGN_HEX_COLOR.slate700,
      accent_color: DESIGN_HEX_COLOR.accent,
      sidebar_background: DESIGN_HEX_COLOR.bgDark,
      card_background: DESIGN_HEX_COLOR.gray800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98,
    },
    userDashboard: {
      background_type: "color",
      background_value: DESIGN_HEX_COLOR.bgDark,
      primary_button_color: DESIGN_HEX_COLOR.primary,
      secondary_button_color: DESIGN_HEX_COLOR.slate700,
      accent_color: DESIGN_HEX_COLOR.accent,
      sidebar_background: DESIGN_HEX_COLOR.bgDark,
      card_background: DESIGN_HEX_COLOR.gray800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98,
    },
    login: {
      background_type: "color",
      background_value: DESIGN_HEX_COLOR.bgDark,
      primary_button_color: DESIGN_HEX_COLOR.primary,
      secondary_button_color: DESIGN_HEX_COLOR.slate700,
      accent_color: DESIGN_HEX_COLOR.accent,
      sidebar_background: "transparent",
      card_background: DESIGN_HEX_COLOR.gray800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1,
    },
    // Modo claro
    lightMode: {
      panel: {
        background_type: "color",
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: DESIGN_HEX_COLOR.bgLight,
        card_background: DESIGN_HEX_COLOR.bgLight,
        text_color: DESIGN_HEX_COLOR.slate800,
        border_color: DESIGN_HEX_COLOR.gray200,
        modal_opacity: 0.98,
        card_opacity: 1,
        sidebar_opacity: 1,
      },
      userDashboard: {
        background_type: "color",
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: DESIGN_HEX_COLOR.bgLight,
        card_background: DESIGN_HEX_COLOR.bgLight,
        text_color: DESIGN_HEX_COLOR.slate800,
        border_color: DESIGN_HEX_COLOR.gray200,
        modal_opacity: 0.98,
        card_opacity: 1,
        sidebar_opacity: 1,
      },
      login: {
        background_type: "color",
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: "transparent",
        card_background: DESIGN_HEX_COLOR.bgLight,
        text_color: DESIGN_HEX_COLOR.slate800,
        border_color: DESIGN_HEX_COLOR.gray200,
        modal_opacity: 0.98,
        card_opacity: 1,
        sidebar_opacity: 1,
      },
    },
  },
};

export const DEFAULT_THEME = "SOFLIA";

export function getThemeById(themeId: string): ThemeConfig | null {
  // Compatibilidad con temas legacy
  if (themeId === 'SOFLIA-predeterminado' || themeId === 'SOFLIA-claro' || themeId === 'SofLIA-predeterminado') {
    return PRESET_THEMES['SOFLIA'] || null;
  }
  return PRESET_THEMES[themeId] || null;
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(PRESET_THEMES);
}

/**
 * Obtiene los estilos del tema para un modo específico
 * @param themeId - ID del tema
 * @param mode - Modo 'light' o 'dark'
 * @returns Estilos del tema para el modo especificado o null si no existe
 */
export function getThemeStylesForMode(
  themeId: string,
  mode: 'light' | 'dark'
): ThemeModeStyles | null {
  // Compatibilidad con temas legacy
  const effectiveThemeId = (themeId === 'SOFLIA-predeterminado' || themeId === 'SOFLIA-claro' || themeId === 'SofLIA-predeterminado') 
    ? 'SOFLIA' 
    : themeId;
    
  const theme = PRESET_THEMES[effectiveThemeId];
  if (!theme) return null;

  // Si el tema soporta modo dual y se pide modo light, usar lightMode
  if (theme.supportsDualMode && mode === 'light' && theme.lightMode) {
    return theme.lightMode;
  }

  // Por defecto retornar los estilos del modo oscuro (propiedades principales)
  return {
    panel: theme.panel,
    userDashboard: theme.userDashboard,
    login: theme.login,
  };
}
