import React from 'react'
import { chooseReadableTextColor, hexToRgbChannels } from '@/core/theme/color-engine'
import { StyleConfig } from '../hooks/useOrganizationStyles'

export function generateInlineStyles(style: Partial<StyleConfig> | null | undefined): React.CSSProperties {
  if (!style) {
    return {}
  }

  const styles: React.CSSProperties = {}

  if (style.background_type === 'image' && style.background_value) {
    styles.backgroundImage = `url(${style.background_value})`
    styles.backgroundSize = 'cover'
    styles.backgroundPosition = 'center'
    styles.backgroundRepeat = 'no-repeat'
  } else if (style.background_type === 'gradient' && style.background_value) {
    styles.background = style.background_value
  } else if (style.background_type === 'color' && style.background_value) {
    styles.backgroundColor = style.background_value
  }

  if (style.text_color) {
    styles.color = style.text_color
  }

  if (style.border_color) {
    styles.borderColor = style.border_color
  }

  return styles
}

export function hexToRgb(hex: string): string {
  return hexToRgbChannels(hex)
}

export function generateCSSVariables(style: Partial<StyleConfig> | null | undefined): Record<string, string> {
  if (!style) {
    return {}
  }

  const variables: Record<string, string> = {}

  if (style.primary_button_color) {
    variables['--org-primary-button-color'] = style.primary_button_color
    variables['--org-brand-primary'] = style.primary_button_color
    variables['--org-action-color'] = style.primary_button_color
    variables['--org-on-action-color'] = chooseReadableTextColor(style.primary_button_color)
  }
  if (style.secondary_button_color) {
    variables['--org-secondary-button-color'] = style.secondary_button_color
    variables['--org-brand-secondary'] = style.secondary_button_color
  }
  if (style.accent_color) {
    variables['--org-accent-color'] = style.accent_color
    variables['--org-brand-accent'] = style.accent_color
  }
  if (style.sidebar_background) {
    variables['--org-sidebar-background'] = style.sidebar_background
  }
  if (style.card_background) {
    variables['--org-card-background'] = style.card_background
    variables['--org-card-background-rgb'] = hexToRgb(style.card_background)
  }

  if (style.text_color) {
    variables['--org-text-color'] = style.text_color
  }

  if (style.border_color) {
    variables['--org-border-color'] = style.border_color
  }

  if (style.modal_opacity !== undefined) {
    variables['--org-modal-opacity'] = style.modal_opacity.toString()
  }

  if (style.card_opacity !== undefined) {
    variables['--org-card-opacity'] = style.card_opacity.toString()
  }

  if (style.sidebar_opacity !== undefined) {
    variables['--org-sidebar-opacity'] = style.sidebar_opacity.toString()
  }

  return variables
}

export function applyBackgroundStyles(
  element: HTMLElement | null,
  style: Partial<StyleConfig> | null | undefined,
): void {
  if (!element || !style) return

  element.style.background = ''
  element.style.backgroundColor = ''
  element.style.backgroundImage = ''
  element.style.backgroundSize = ''
  element.style.backgroundPosition = ''
  element.style.backgroundRepeat = ''

  if (style.background_type === 'image' && style.background_value) {
    element.style.backgroundImage = `url(${style.background_value})`
    element.style.backgroundSize = 'cover'
    element.style.backgroundPosition = 'center'
    element.style.backgroundRepeat = 'no-repeat'
  } else if (style.background_type === 'gradient' && style.background_value) {
    element.style.background = style.background_value
  } else if (style.background_type === 'color' && style.background_value) {
    element.style.backgroundColor = style.background_value
  }
}

export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

export function stylesToCSSString(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}

export function getBackgroundStyle(style: Partial<StyleConfig> | null | undefined): React.CSSProperties {
  if (!style) {
    return {}
  }

  const bgStyle: React.CSSProperties = {}

  switch (style.background_type) {
    case 'image':
      if (style.background_value) {
        bgStyle.backgroundImage = `url(${style.background_value})`
        bgStyle.backgroundSize = 'cover'
        bgStyle.backgroundPosition = 'center'
        bgStyle.backgroundRepeat = 'no-repeat'
      }
      break
    case 'gradient':
      if (style.background_value) {
        bgStyle.background = style.background_value
      }
      break
    case 'color':
      if (style.background_value) {
        bgStyle.backgroundColor = style.background_value
      }
      break
  }

  return bgStyle
}
