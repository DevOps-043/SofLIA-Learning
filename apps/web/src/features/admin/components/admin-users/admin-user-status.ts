import { XCircle } from 'lucide-react'
import type { AdminStatusConfig, AdminTheme } from './types'

export function getAdminRemovedStatusConfig(theme: AdminTheme, label: string): AdminStatusConfig {
  return {
    label,
    color: theme.dangerColor,
    bg: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)`,
    border: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)`,
    icon: XCircle,
  }
}
