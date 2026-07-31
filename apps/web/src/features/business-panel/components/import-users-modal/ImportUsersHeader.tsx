'use client'

import { FileUp, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'
import type { ImportResult } from './import-users.types'

export function ImportUsersHeader({
  importResult,
  onClose,
}: {
  importResult: ImportResult | null
  onClose: () => void
}) {
  const { t } = useTranslation('business')

  return (
    <header className={styles.header}>
      <span aria-hidden="true" className={styles.contextIcon}>
        <FileUp />
      </span>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Carga administrada</p>
        <h2 className={styles.title} id="business-import-users-title">
          {importResult
            ? t('users.modals.import.resultTitle')
            : t('users.modals.import.uploadTitle')}
        </h2>
        <p className={styles.subtitle}>
          {importResult
            ? t('users.modals.import.resultSubtitle')
            : 'Selecciona o arrastra un archivo CSV compatible.'}
        </p>
      </div>
      <button
        aria-label={t('users.buttons.close', 'Cerrar')}
        className={styles.closeButton}
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" />
      </button>
    </header>
  )
}
