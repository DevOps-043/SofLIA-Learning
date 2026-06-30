'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { ImportUsersContent } from './import-users-modal/ImportUsersContent'
import { ImportUsersFooter } from './import-users-modal/ImportUsersFooter'
import { ImportUsersHeader } from './import-users-modal/ImportUsersHeader'
import { ImportUsersPreviewPanel } from './import-users-modal/ImportUsersPreviewPanel'
import type { BusinessImportUsersModalProps } from './import-users-modal/import-users.types'
import { useBusinessImportUsersModal } from './import-users-modal/useBusinessImportUsersModal'

export function BusinessImportUsersModal({
  isOpen,
  onClose,
  onImportComplete,
}: BusinessImportUsersModalProps) {
  const theme = useBusinessPanelTheme()
  const state = useBusinessImportUsersModal({ onClose, onImportComplete })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={state.handleClose} className="absolute inset-0" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={event => event.stopPropagation()}>
          <div className="rounded-2xl shadow-2xl overflow-hidden border" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">
              <ImportUsersPreviewPanel
                importResult={state.importResult}
                onDownloadTemplate={state.handleDownloadTemplate}
                selectedFile={state.selectedFile}
              />
              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                <ImportUsersHeader importResult={state.importResult} onClose={state.handleClose} />
                <ImportUsersContent state={state} />
                <ImportUsersFooter state={state} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
