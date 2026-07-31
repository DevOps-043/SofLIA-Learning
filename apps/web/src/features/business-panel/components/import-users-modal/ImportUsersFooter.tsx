'use client'

import type { ReactNode } from 'react'
import { FileUp, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'
import type { ImportUsersModalState } from './import-users.types'

export function ImportUsersFooter({ state }: { state: ImportUsersModalState }) {
  const { t } = useTranslation('business')

  return (
    <footer className={styles.footer}>
      <span className={styles.footerHint}>
        <FileUp aria-hidden="true" />
        Archivo CSV
      </span>
      <div className={styles.footerActions}>
        {state.importResult ? (
          <>
            <FooterButton onClick={state.handleReset}>
              {t('users.buttons.importAnother')}
            </FooterButton>
            <PrimaryFooterButton onClick={state.handleClose}>
              {t('users.buttons.finish')}
            </PrimaryFooterButton>
          </>
        ) : (
          <>
            <FooterButton disabled={state.isImporting} onClick={state.handleClose}>
              {t('users.buttons.cancel')}
            </FooterButton>
            <PrimaryFooterButton
              disabled={!state.selectedFile || state.isImporting}
              onClick={state.processFile}
            >
              <Upload aria-hidden="true" />
              {state.isImporting
                ? t('users.modals.import.loading.title')
                : t('users.buttons.import')}
            </PrimaryFooterButton>
          </>
        )}
      </div>
    </footer>
  )
}

function FooterButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={styles.secondaryButton}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function PrimaryFooterButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void | Promise<void>
}) {
  return (
    <button
      className={styles.primaryButton}
      disabled={disabled}
      onClick={() => void onClick()}
      type="button"
    >
      {children}
    </button>
  )
}
