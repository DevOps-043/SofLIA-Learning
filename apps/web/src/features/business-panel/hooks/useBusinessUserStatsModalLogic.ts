'use client'

import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from './useBusinessPanelTheme'
import {
  getBusinessUserStatsDisplayName,
  getBusinessUserStatsInitials,
} from '../services/business-user-stats-display.service'
import type { BusinessUserStatsTranslateOptions } from '../components/business-user-stats-modal/types'
import type { BusinessUser } from '../services/businessUsers.service'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  onClose: () => void
}

export function useBusinessUserStatsModalLogic({ user, onClose: _onClose }: BusinessUserStatsModalProps) {
  const { t: originalT } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const t = (key: string, options?: BusinessUserStatsTranslateOptions): string => {
    const translationOptions = typeof options === 'string' ? { defaultValue: options } : options
    const result = originalT(key, translationOptions)
    const resultString = typeof result === 'string' ? result : String(result)
    if (resultString === key || resultString.includes('.stats.')) {
      return typeof options === 'string' ? options : key
    }
    return resultString
  }

  return {
    t,
    isDark:          theme.isDark,
    modalBg:         theme.panelBg,
    modalBorder:     theme.borderColor,
    textColor:       theme.textColor,
    primaryColor:    theme.primaryColor,
    accentColor:     theme.accentColor,
    secondaryColor:  theme.secondaryColor,
    displayName:     getBusinessUserStatsDisplayName(user),
    initials:        getBusinessUserStatsInitials(user),
  }
}
