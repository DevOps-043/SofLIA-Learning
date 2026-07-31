'use client'

import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'
import type { ImportUsersModalState } from './import-users.types'

export function ImportUsersDropZone({ state }: { state: ImportUsersModalState }) {
  const { t } = useTranslation('business')

  return (
    <motion.div
      aria-busy={state.isImporting}
      className={`${styles.dropZone} ${state.isDragging ? styles.dropZoneActive : ''}`}
      onClick={() => state.fileInputRef.current?.click()}
      onDragLeave={state.handleDragLeave}
      onDragOver={state.handleDragOver}
      onDrop={state.handleDrop}
      role="button"
      tabIndex={state.isImporting ? -1 : 0}
      onKeyDown={(event) => {
        if (!state.isImporting && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          state.fileInputRef.current?.click()
        }
      }}
    >
      <input
        ref={state.fileInputRef}
        accept=".csv"
        disabled={state.isImporting}
        hidden
        onChange={state.handleFileInputChange}
        type="file"
      />

      {state.isImporting ? (
        <div>
          <motion.div
            animate={{ rotate: 360 }}
            className={styles.spinner}
            transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
          />
          <p className={styles.dropTitle}>
            {t('users.modals.import.loading.title')}
          </p>
          <p className={styles.dropCopy}>
            {t('users.modals.import.loading.subtitle')}
          </p>
        </div>
      ) : (
        <div>
          <span aria-hidden="true" className={styles.dropIcon}>
            <Upload />
          </span>
          <p className={styles.dropTitle}>
            {state.isDragging
              ? t('users.modals.import.dragDrop.drop')
              : t('users.modals.import.dragDrop.drag')}
          </p>
          <p className={styles.dropCopy}>
            {t('users.modals.import.dragDrop.orKey')}
          </p>
        </div>
      )}
    </motion.div>
  )
}
