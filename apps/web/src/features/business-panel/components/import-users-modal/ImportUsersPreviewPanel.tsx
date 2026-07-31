'use client'

import {
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'
import type { ImportResult } from './import-users.types'

interface ImportUsersPreviewPanelProps {
  importResult: ImportResult | null
  onDownloadTemplate: () => void | Promise<void>
  selectedFile: File | null
}

export function ImportUsersPreviewPanel({
  importResult,
  onDownloadTemplate,
  selectedFile,
}: ImportUsersPreviewPanelProps) {
  const { t } = useTranslation('business')

  return (
    <aside className={styles.importAside}>
      <div className={styles.importAsideMain}>
        <span aria-hidden="true" className={styles.importHeroIcon}>
          <Upload />
        </span>
        <h2 className={styles.importHeroTitle}>{t('users.modals.import.title')}</h2>
        <p className={styles.importHeroCopy}>
          Agrega múltiples usuarios con una carga validada y reversible antes de confirmar.
        </p>
        <PreviewState importResult={importResult} selectedFile={selectedFile} />
      </div>

      <button
        className={styles.secondaryButton}
        onClick={() => void onDownloadTemplate()}
        type="button"
      >
        <Download aria-hidden="true" />
        {t('users.modals.import.downloadTemplate')}
      </button>
    </aside>
  )
}

function PreviewState({
  importResult,
  selectedFile,
}: Pick<ImportUsersPreviewPanelProps, 'importResult' | 'selectedFile'>) {
  if (importResult) {
    return (
      <div className={styles.statPreview}>
        <Stat label="Procesados" value={importResult.total} />
        <Stat label="Importados" value={importResult.imported} />
        {importResult.errors > 0 && (
          <Stat label="Con error" value={importResult.errors} />
        )}
      </div>
    )
  }

  if (selectedFile) {
    return (
      <div className={styles.filePreview}>
        <span aria-hidden="true" className={styles.filePreviewIcon}>
          <FileSpreadsheet />
        </span>
        <span className="min-w-0">
          <span className={styles.filePreviewName}>{selectedFile.name}</span>
          <span className={styles.filePreviewMeta}>
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className={styles.emptyPreview}>
      <FileText aria-hidden="true" />
      Ningún archivo seleccionado
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
