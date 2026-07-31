'use client'

import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'
import type { ImportUsersModalState } from './import-users.types'
import { ImportUsersDropZone } from './ImportUsersDropZone'
import { ImportUsersErrorAlert } from './ImportUsersErrorAlert'
import { ImportUsersFormatInfo } from './ImportUsersFormatInfo'
import { ImportUsersResult } from './ImportUsersResult'

export function ImportUsersContent({ state }: { state: ImportUsersModalState }) {
  const { t } = useTranslation('business')

  return (
    <div className={styles.importContent}>
      <ImportUsersErrorAlert error={state.error} onDismiss={() => state.setError(null)} />
      {state.importResult ? (
        <ImportUsersResult importResult={state.importResult} />
      ) : (
        <div>
          <ImportUsersDropZone state={state} />
          <ImportUsersFormatInfo />
          <button
            className={styles.mobileTemplateButton}
            onClick={() => void state.handleDownloadTemplate()}
            type="button"
          >
            <Download aria-hidden="true" />
            {t('users.modals.import.downloadTemplate')}
          </button>
        </div>
      )}
    </div>
  )
}
