import { XCircle } from 'lucide-react'
import type { AdminStatusConfig, AdminTheme } from './types'

export function getAdminRemovedStatusConfig(theme: AdminTheme, label: string): AdminStatusConfig {
  return {
    label,
    color: theme.dangerColor,
    bg: `${theme.dangerColor}14`,
    border: `${theme.dangerColor}26`,
    icon: XCircle,
  }
}
