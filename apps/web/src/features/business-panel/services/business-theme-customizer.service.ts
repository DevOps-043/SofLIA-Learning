import type { StyleConfig } from '../contexts/OrganizationStylesContext';
import type { ThemeConfig } from '../config/preset-themes';
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens';

export type ActivePanel = 'panel' | 'userDashboard' | 'login';

export interface ParsedGradientStyle {
  angle: number;
  colors: string[];
}

export interface BusinessThemeColorField {
  field:
    | 'primary_button_color'
    | 'secondary_button_color'
    | 'text_color'
    | 'accent_color'
    | 'sidebar_background'
    | 'card_background'
    | 'border_color';
  label: string;
  defaultValue: string;
}

export const BUSINESS_THEME_COLOR_FIELDS: BusinessThemeColorField[] = [
  { field: 'primary_button_color', label: 'Boton Primario', defaultValue: DESIGN_HEX_COLOR.info },
  { field: 'secondary_button_color', label: 'Boton Secundario', defaultValue: DESIGN_HEX_COLOR.secondary },
  { field: 'text_color', label: 'Color de Texto', defaultValue: DESIGN_HEX_COLOR.bgLight },
  { field: 'accent_color', label: 'Color Acento', defaultValue: DESIGN_HEX_COLOR.blue400 },
  { field: 'sidebar_background', label: 'Fondo Sidebar', defaultValue: DESIGN_HEX_COLOR.slate800 },
  { field: 'card_background', label: 'Fondo Tarjetas', defaultValue: DESIGN_HEX_COLOR.slate800 },
  { field: 'border_color', label: 'Color Bordes', defaultValue: DESIGN_HEX_COLOR.slate700 },
];

const BUSINESS_THEME_ICON_MAP: Record<string, string> = {
  SOFLIA: 'T',
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
  'branding-personalizado': '*',
};

export function getDefaultBusinessStyle(): StyleConfig {
  return {
    background_type: 'gradient',
    background_value: `linear-gradient(135deg, ${DESIGN_HEX_COLOR.blue900} 0%, ${DESIGN_HEX_COLOR.blue800} 50%, ${DESIGN_HEX_COLOR.blue800} 100%)`,
    primary_button_color: DESIGN_HEX_COLOR.info,
    secondary_button_color: DESIGN_HEX_COLOR.blue600,
    accent_color: DESIGN_HEX_COLOR.blue400,
    sidebar_background: DESIGN_HEX_COLOR.slate800,
    card_background: DESIGN_HEX_COLOR.slate800,
    text_color: DESIGN_HEX_COLOR.gray50,
    border_color: DESIGN_HEX_COLOR.slate700,
    modal_opacity: 0.95,
    card_opacity: 1,
    sidebar_opacity: 1,
  };
}

export function parseGradientStyleValue(backgroundValue: string): ParsedGradientStyle | null {
  if (!backgroundValue.includes('linear-gradient')) {
    return null;
  }

  const match = backgroundValue.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
  if (!match) {
    return null;
  }

  const colorMatches = match[2].match(/#[0-9a-fA-F]{6}/g);
  if (!colorMatches || colorMatches.length < 2) {
    return null;
  }

  return {
    angle: Number.parseInt(match[1], 10) || 135,
    colors: colorMatches,
  };
}

export function buildGradientCss(colors: string[], angle: number): string {
  if (colors.length < 2) {
    return `linear-gradient(135deg, ${DESIGN_HEX_COLOR.blue900}, ${DESIGN_HEX_COLOR.blue800})`;
  }

  const colorsWithStops = colors
    .map((color, index) => {
      const stop = (index / (colors.length - 1)) * 100;
      return `${color} ${stop}%`;
    })
    .join(', ');

  return `linear-gradient(${angle}deg, ${colorsWithStops})`;
}

export function isValidHexColor(value: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}

export function getBusinessThemeIcon(themeId: string): string {
  return BUSINESS_THEME_ICON_MAP[themeId] || 'T';
}

export function getBusinessThemePreview(theme: ThemeConfig): string {
  if (theme.id === 'branding-personalizado') {
    return `linear-gradient(135deg, ${DESIGN_HEX_COLOR.amber400}, ${DESIGN_HEX_COLOR.warning})`;
  }

  return theme.panel.background_value;
}

export function matchesBusinessTheme(selectedTheme: string | null | undefined, themeId: string): boolean {
  if (!selectedTheme) {
    return false;
  }

  if (selectedTheme === themeId) {
    return true;
  }

  return (
    themeId === 'SOFLIA' &&
    (selectedTheme === 'SOFLIA-predeterminado' || selectedTheme === 'SOFLIA-claro')
  );
}
