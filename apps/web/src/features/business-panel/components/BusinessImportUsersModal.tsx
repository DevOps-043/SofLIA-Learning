'use client'

import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import styles from './AdministrativeModal.module.css'
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

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !state.isImporting) state.handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, state.handleClose, state.isImporting])

  if (!isOpen || typeof document === 'undefined') return null

  const modalStyle = {
    '--admin-modal-accent': theme.accentColor,
    '--admin-modal-border': theme.borderColor,
    '--admin-modal-danger': theme.dangerColor,
    '--admin-modal-input': theme.inputBg,
    '--admin-modal-muted': theme.mutedTextColor,
    '--admin-modal-on-primary': theme.onPrimaryColor,
    '--admin-modal-primary': theme.primaryColor,
    '--admin-modal-success': theme.successColor,
    '--admin-modal-surface': theme.panelBg,
    '--admin-modal-text': theme.textColor,
    '--admin-modal-warning': theme.warningColor,
    '--admin-modal-width': '58rem',
    '--admin-modal-height': '42rem',
  } as CSSProperties

  return createPortal(
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className={styles.overlay}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onMouseDown={() => {
          if (!state.isImporting) state.handleClose()
        }}
        style={modalStyle}
      >
        <motion.section
          aria-labelledby="business-import-users-title"
          aria-modal="true"
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={styles.dialog}
          exit={{ opacity: 0, scale: 0.985, y: 12 }}
          initial={{ opacity: 0, scale: 0.975, y: 18 }}
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.importLayout}>
            <ImportUsersPreviewPanel
              importResult={state.importResult}
              onDownloadTemplate={state.handleDownloadTemplate}
              selectedFile={state.selectedFile}
            />
            <div className={styles.importMain}>
              <ImportUsersHeader
                importResult={state.importResult}
                onClose={state.handleClose}
              />
              <ImportUsersContent state={state} />
              <ImportUsersFooter state={state} />
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
