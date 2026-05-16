'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import { getEditWorkshopStatusOptions } from './service'
import { EditWorkshopBasicTab } from './EditWorkshopBasicTab'
import { EditWorkshopModalFooter } from './EditWorkshopModalFooter'
import { EditWorkshopModalTabs } from './EditWorkshopModalTabs'
import { EditWorkshopStatusTab } from './EditWorkshopStatusTab'
import { useEditWorkshopModalState } from './useEditWorkshopModalState'

interface EditWorkshopModalProps {
  workshop: AdminWorkshop | null
  onClose: () => void
  onSave: (data: Partial<AdminWorkshop>) => Promise<void>
}

export function EditWorkshopModal({ workshop, onClose, onSave }: EditWorkshopModalProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const state = useEditWorkshopModalState(workshop, t, onClose, onSave)
  if (!workshop) return null
  const styles = { field: (hasError = false) => ({ backgroundColor: theme.inputBg, borderColor: hasError ? theme.dangerColor : theme.borderColor, color: theme.textColor }), label: { color: theme.mutedTextColor }, icon: { color: theme.subtextColor } }
  const statusOptions = getEditWorkshopStatusOptions(theme)
  const currentApprovalStatus = statusOptions.find((status) => status.value === state.formData.approval_status) ?? statusOptions[0]

  return (
    <AnimatePresence>{workshop ? <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} onClick={onClose} /><div className="fixed inset-0 z-50 overflow-y-auto"><div className="flex min-h-screen items-center justify-center p-4"><motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }} className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }} onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: theme.borderColor }}><div><h3 className="text-lg font-bold" style={{ color: theme.textColor }}>{t('workshops.editModal.title')}</h3><p className="text-xs" style={{ color: theme.subtextColor }}>{workshop.title}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2" style={{ color: theme.subtextColor }}><X className="h-5 w-5" /></button></div><EditWorkshopModalTabs activeTab={state.activeTab} onChange={state.setActiveTab} /><form onSubmit={state.handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="min-h-0 flex-1 overflow-y-auto">{state.activeTab === 'basic' ? <EditWorkshopBasicTab formData={state.formData} errors={state.errors} styles={styles} onInputChange={state.handleInputChange} /> : <EditWorkshopStatusTab workshop={workshop} formData={state.formData} errors={state.errors} currentApprovalStatus={currentApprovalStatus} statusOptions={statusOptions} theme={theme} styles={styles} onInputChange={state.handleInputChange} />}</div><EditWorkshopModalFooter loading={state.loading} saveError={state.saveError} onClose={onClose} /></form></motion.div></div></div></> : null}</AnimatePresence>
  )
}
