import { Scale, Sprout, Zap } from 'lucide-react'
import type { ApproachConfigMap, BusinessPanelTheme } from './types'

export function getApproachConfig(theme: BusinessPanelTheme): ApproachConfigMap {
  return {
    fast: {
      icon: Zap,
      color: theme.dangerColor,
      background: `linear-gradient(135deg, ${theme.dangerColor}, ${theme.warningColor})`,
    },
    balanced: {
      icon: Scale,
      color: theme.secondaryColor,
      background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.accentColor})`,
    },
    long: {
      icon: Sprout,
      color: theme.successColor,
      background: `linear-gradient(135deg, ${theme.successColor}, ${theme.accentColor})`,
    },
  }
}
