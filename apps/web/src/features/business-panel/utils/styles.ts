import React from 'react';
import { StyleConfig } from '../hooks/useOrganizationStyles';

/**
 * Genera estilos inline desde un objeto StyleConfig
 */
export function generateInlineStyles(style: StyleConfig | null | undefined): React.CSSProperties {
  if (!style) {
    return {};
  }

  const styles: React.CSSProperties = {};

  // Background
  if (style.background_type === 'image' && style.background_value) {
    styles.backgroundImage = `url(${style.background_value})`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
    styles.backgroundRepeat = 'no-repeat';
  } else if (style.background_type === 'gradient' && style.background_value) {
    styles.background = style.background_value;
  } else if (style.background_type === 'color' && style.background_value) {
    styles.backgroundColor = style.background_value;
  }

  // Colores de texto
  if (style.text_color) {
    styles.color = style.text_color;
  }

  // Border
  if (style.border_color) {
    styles.borderColor = style.border_color;
  }

  return styles;
}

/**
 * Convierte color hex a RGB
 */
export function hexToRgb(hex: string): string {
  // Si no es un color hex válido, retornar valores por defecto
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return '15, 23, 42'; // Valores por defecto
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return '15, 23, 42'; // Valores por defecto
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
}

/**
 * Genera CSS variables dinámicas desde un objeto StyleConfig
 */
export function generateCSSVariables(style: StyleConfig | null | undefined): Record<string, string> {
  if (!style) {
    return {};
  }

  const variables: Record<string, string> = {};

  if (style.primary_button_color) {
    variables['--org-primary-button-color'] = style.primary_button_color;
  }
  if (style.secondary_button_color) {
    variables['--org-secondary-button-color'] = style.secondary_button_color;
  }
  if (style.accent_color) {
    variables['--org-accent-color'] = style.accent_color;
  }
  if (style.sidebar_background) {
    variables['--org-sidebar-background'] = style.sidebar_background;
  }
  if (style.card_background) {
    variables['--org-card-background'] = style.card_background;
    variables['--org-card-background-rgb'] = hexToRgb(style.card_background);
  }
  
  if (style.text_color) {
    variables['--org-text-color'] = style.text_color;
  }
  
  if (style.border_color) {
    variables['--org-border-color'] = style.border_color;
  }

  if (style.modal_opacity !== undefined) {
    variables['--org-modal-opacity'] = style.modal_opacity.toString();
  }

  if (style.card_opacity !== undefined) {
    variables['--org-card-opacity'] = style.card_opacity.toString();
  }

  if (style.sidebar_opacity !== undefined) {
    variables['--org-sidebar-opacity'] = style.sidebar_opacity.toString();
  }

  return variables;
}

/**
 * Aplica estilos a un elemento con background
 */
export function applyBackgroundStyles(
  element: HTMLElement | null,
  style: StyleConfig | null | undefined
): void {
  if (!element || !style) return;

  // Limpiar estilos previos
  element.style.background = '';
  element.style.backgroundColor = '';
  element.style.backgroundImage = '';
  element.style.backgroundSize = '';
  element.style.backgroundPosition = '';
  element.style.backgroundRepeat = '';

  // Aplicar nuevo background
  if (style.background_type === 'image' && style.background_value) {
    element.style.backgroundImage = `url(${style.background_value})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
  } else if (style.background_type === 'gradient' && style.background_value) {
    element.style.background = style.background_value;
  } else if (style.background_type === 'color' && style.background_value) {
    element.style.backgroundColor = style.background_value;
  }
}

/**
 * Valida que un color hex sea válido
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Convierte un objeto de estilos a CSS string
 */
export function stylesToCSSString(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}

/**
 * Obtiene el valor de background para usar en className o style
 */
export function getBackgroundStyle(style: StyleConfig | null | undefined): React.CSSProperties {
  if (!style) {
    return {};
  }

  const bgStyle: React.CSSProperties = {};

  switch (style.background_type) {
    case 'image':
      if (style.background_value) {
        bgStyle.backgroundImage = `url(${style.background_value})`;
        bgStyle.backgroundSize = 'cover';
        bgStyle.backgroundPosition = 'center';
        bgStyle.backgroundRepeat = 'no-repeat';
      }
      break;
    case 'gradient':
      if (style.background_value) {
        bgStyle.background = style.background_value;
      }
      break;
    case 'color':
      if (style.background_value) {
        bgStyle.backgroundColor = style.background_value;
      }
      break;
  }

  return bgStyle;
}
