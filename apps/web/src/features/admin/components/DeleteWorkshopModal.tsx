'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import type { AdminWorkshop } from '../services/adminWorkshops.service'
import { DeleteWorkshopDetails } from './delete-workshop-modal/DeleteWorkshopDetails'
import { DeleteWorkshopFooter } from './delete-workshop-modal/DeleteWorkshopFooter'

interface DeleteWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  workshop: AdminWorkshop | null
  onConfirm: () => Promise<void>
}

export function DeleteWorkshopModal({ isOpen, onClose, workshop, onConfirm }: DeleteWorkshopModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  useEffect(() => { if (isOpen) setDeleteError(null) }, [isOpen, workshop?.id])
  if (!isOpen || !workshop) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onConfirm()
    } catch (error) {
      setDeleteError(error instanceof Error && error.message.trim().length > 0 ? error.message : t('generic.errorDeleting'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>{isOpen ? <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} onClick={onClose} /><div className="fixed inset-0 z-50 overflow-y-auto"><div className="flex min-h-screen items-center justify-center p-4"><motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }} className="relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }} onClick={(event) => event.stopPropagation()}><div className="relative border-b px-6 py-4" style={{ background: `linear-gradient(135deg, ${theme.dangerColor}, color-mix(in srgb, ${theme.dangerColor} 85.1%, transparent))`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 20%, transparent)` }}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.inverseSurface }}><AlertTriangle className="h-5 w-5" style={{ color: theme.inverseTextColor }} /></div><div><h3 className="text-lg font-bold" style={{ color: theme.inverseTextColor }}>{t('workshops.deleteModal.title')}</h3><p className="text-xs" style={{ color: theme.inverseSubtextColor }}>{t('generic.irreversible')}</p></div></div><motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="rounded-lg p-2 transition-colors duration-200" style={{ color: theme.inverseSubtextColor }} type="button"><X className="h-5 w-5" /></motion.button></div></div><div className="p-6"><div className="mb-6 flex items-start gap-4"><div className="flex-shrink-0 rounded-xl p-3" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)` }}><AlertTriangle className="h-8 w-8" style={{ color: theme.dangerColor }} /></div><div className="flex-1"><h3 className="mb-2 text-lg font-semibold" style={{ color: theme.textColor }}>{t('workshops.deleteModal.confirmText')}</h3><p className="text-sm" style={{ color: theme.subtextColor }}>{t('generic.irreversible')}</p></div></div><DeleteWorkshopDetails workshop={workshop} />{workshop.student_count > 0 ? <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-xl border p-4" style={{ backgroundColor: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)` }}><p className="text-sm font-medium" style={{ color: theme.warningColor }}>{t('workshops.deleteModal.enrolledWarning', { count: workshop.student_count })}</p></motion.div> : null}<DeleteWorkshopFooter isDeleting={isDeleting} deleteError={deleteError} onClose={onClose} onConfirm={handleConfirm} /></div></motion.div></div></div></> : null}</AnimatePresence>
  )
}
