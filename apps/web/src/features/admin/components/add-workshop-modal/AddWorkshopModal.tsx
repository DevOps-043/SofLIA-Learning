'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AddWorkshopBasicTab } from './AddWorkshopBasicTab'
import { AddWorkshopDetailsTab } from './AddWorkshopDetailsTab'
import { AddWorkshopModalFooter } from './AddWorkshopModalFooter'
import { AddWorkshopModalHeader } from './AddWorkshopModalHeader'
import { AddWorkshopModalTabs } from './AddWorkshopModalTabs'
import { useAddWorkshopFormState } from './useAddWorkshopFormState'

interface AddWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
}

const AddWorkshopMediaTab = dynamic(() => import('./AddWorkshopMediaTab').then((module) => ({ default: module.AddWorkshopMediaTab })), { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)] dark:border-white/10 dark:bg-white/5" /> })

export function AddWorkshopModal({ isOpen, onClose, onSave }: AddWorkshopModalProps) {
  const theme = useAdminPanelTheme()
  const { formData, setFormData, instructors, isLoading, error, errors, activeTab, setActiveTab, handleChange, handleSubmit } = useAddWorkshopFormState({ isOpen, onSave, onClose })
  if (!isOpen) return null

  return (
    <AnimatePresence>{isOpen ? <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} onClick={onClose} /><div className="fixed inset-0 z-50 overflow-y-auto"><div className="flex min-h-screen items-center justify-center p-4"><motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }} className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }} onClick={(event) => event.stopPropagation()}><AddWorkshopModalHeader onClose={onClose} /><AddWorkshopModalTabs activeTab={activeTab} onChange={setActiveTab} /><form onSubmit={handleSubmit} className="flex-1 overflow-y-auto"><div className="p-6">{error ? <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-xl border p-4" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)` }}><p className="text-sm" style={{ color: theme.dangerColor }}>{error}</p></motion.div> : null}<AnimatePresence mode="wait">{activeTab === 'basic' ? <AddWorkshopBasicTab formData={formData} instructors={instructors} errors={errors} onChange={handleChange} /> : null}{activeTab === 'details' ? <AddWorkshopDetailsTab formData={formData} errors={errors} onChange={handleChange} /> : null}{activeTab === 'media' ? <motion.div key="media" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4"><AddWorkshopMediaTab thumbnailUrl={formData.thumbnail_url} onThumbnailChange={(url) => setFormData((prev) => ({ ...prev, thumbnail_url: url }))} disabled={isLoading} /></motion.div> : null}</AnimatePresence></div><AddWorkshopModalFooter isLoading={isLoading} onClose={onClose} /></form></motion.div></div></div></> : null}</AnimatePresence>
  )
}
