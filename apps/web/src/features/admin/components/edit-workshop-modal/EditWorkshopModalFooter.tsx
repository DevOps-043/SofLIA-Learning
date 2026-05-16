'use client'

import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface EditWorkshopModalFooterProps {
  loading: boolean
  saveError: string | null
  onClose: () => void
}

export function EditWorkshopModalFooter(props: EditWorkshopModalFooterProps) {
  const { t } = useTranslation('common')
  const theme = useAdminPanelTheme()
  return (
    <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      {props.saveError ? <p className="mr-auto text-xs" style={{ color: theme.dangerColor }}>{props.saveError}</p> : null}
      <motion.button type="button" onClick={props.onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors duration-200" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.subtextColor }} disabled={props.loading}>{t('actions.cancel')}</motion.button>
      <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }} disabled={props.loading}>
        {props.loading ? <><div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: theme.inverseBorderColor, borderTopColor: theme.onPrimaryColor }} /><span>{t('actions.saving')}</span></> : <><CheckCircle className="h-4 w-4" /><span>{t('actions.saveChanges')}</span></>}
      </motion.button>
    </div>
  )
}
