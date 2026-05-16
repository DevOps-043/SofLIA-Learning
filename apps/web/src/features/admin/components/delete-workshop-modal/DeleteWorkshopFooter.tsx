'use client'

import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface DeleteWorkshopFooterProps {
  isDeleting: boolean
  deleteError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteWorkshopFooter(props: DeleteWorkshopFooterProps) {
  const { t } = useTranslation('common')
  const theme = useAdminPanelTheme()
  return (
    <>
      {props.deleteError ? <div className="mb-4 rounded-xl border p-4" style={{ backgroundColor: `${theme.dangerColor}14`, borderColor: `${theme.dangerColor}26` }}><p className="text-sm" style={{ color: theme.dangerColor }}>{props.deleteError}</p></div> : null}
      <div className="flex items-center justify-end gap-3 border-t pt-4" style={{ borderColor: theme.dividerColor }}>
        <motion.button onClick={props.onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={props.isDeleting} className="rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.subtextColor }} type="button">{t('actions.cancel')}</motion.button>
        <motion.button onClick={props.onConfirm} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={props.isDeleting} className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.dangerColor, color: theme.inverseTextColor }} type="button">
          {props.isDeleting ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: theme.inverseBorderColor, borderTopColor: theme.inverseTextColor }} /><span>{t('actions.deleting')}</span></> : <><Trash2 className="h-4 w-4" /><span>{t('actions.delete')}</span></>}
        </motion.button>
      </div>
    </>
  )
}
