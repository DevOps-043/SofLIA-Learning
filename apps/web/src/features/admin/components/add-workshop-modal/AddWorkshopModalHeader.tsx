'use client'

import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function AddWorkshopModalHeader({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="relative border-b px-6 py-4" style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.inverseSurface }}>
            <Plus className="h-5 w-5" style={{ color: theme.accentColor }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: theme.inverseTextColor }}>{t('workshops.addModal.title')}</h3>
            <p className="text-xs" style={{ color: theme.inverseSubtextColor }}>{t('workshops.addModal.description')}</p>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="rounded-lg p-2 transition-colors duration-200" style={{ color: theme.inverseSubtextColor }} type="button">
          <X className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  )
}
