'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'
import type { ImportResult } from './import-users.types'

export function ImportUsersResult({ importResult }: { importResult: ImportResult }) {
  const { t } = useTranslation('business')
  const isSuccess = importResult.imported > 0

  return (
    <div className={styles.resultPanel}>
      <div className={isSuccess ? styles.resultSummary : styles.resultSummaryError}>
        {isSuccess ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <XCircle aria-hidden="true" />
        )}
        <div>
          <p className={styles.resultTitle}>
            {isSuccess
              ? t('users.modals.import.results.successTitle')
              : t('users.modals.import.results.noImportTitle')}
          </p>
          <p className={styles.resultCopy}>
            {importResult.imported} de {importResult.total} usuarios se importaron
            correctamente.
          </p>
        </div>
      </div>

      {importResult.errors > 0 && importResult.details.length > 0 && (
        <section>
          <h3 className={styles.formatTitle}>
            <XCircle aria-hidden="true" />
            {t('users.modals.import.results.errorsFound')} ({importResult.errors})
          </h3>
          <div className={styles.errorList}>
            {importResult.details.slice(0, 10).map((detail) => (
              <div className={styles.errorItem} key={`${detail.row}-${detail.error}`}>
                <strong>Fila {detail.row}:</strong> {detail.error}
              </div>
            ))}
            {importResult.details.length > 10 && (
              <div className={styles.errorItem}>
                Y {importResult.details.length - 10} errores más.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
