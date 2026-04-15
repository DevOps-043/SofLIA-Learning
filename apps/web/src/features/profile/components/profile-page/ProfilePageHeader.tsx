'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ProfileColorPalette } from '../../types/profile.types'

interface ProfilePageHeaderProps {
  colors: ProfileColorPalette
  saving: boolean
  showSaveSuccess: boolean
  goBack: () => void
  handleSave: () => Promise<void>
}

export function ProfilePageHeader({ colors, saving, showSaveSuccess, goBack, handleSave }: ProfilePageHeaderProps) {
  const { t } = useTranslation('common')
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl border-b" style={{ background: colors.bgPrimary, borderColor: colors.border }}>
      <div className="h-full px-6 flex items-center justify-between">
        <motion.button onClick={goBack} className="flex items-center gap-2 transition-colors" style={{ color: colors.textSecondary }} whileHover={{ x: -3, color: colors.text }}>
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">{t('profile.header.back')}</span>
        </motion.button>

        <motion.button
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300"
          style={{
            backgroundColor: saving ? 'rgba(255,255,255,0.1)' : showSaveSuccess ? colors.success : colors.primary,
            color: saving ? colors.textSecondary : '#FFFFFF'
          }}
          whileHover={!saving ? { scale: 1.02 } : undefined}
          whileTap={!saving ? { scale: 0.98 } : undefined}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : showSaveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? t('profile.header.saving') : showSaveSuccess ? t('profile.header.saved') : t('profile.header.saveChanges')}</span>
        </motion.button>
      </div>
    </div>
  )
}
