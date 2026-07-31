import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

const CONFIRM_VARIANTS = ['default', 'success', 'danger', 'neutral'] as const

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: (typeof CONFIRM_VARIANTS)[number]
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const { t } = useTranslation('business')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isLoading, onCancel])

  const destructive = confirmVariant === 'danger'
  const Icon = destructive ? AlertTriangle : CheckCircle2

  return (
    <div className={styles.overlay} onMouseDown={event => {
      if (event.target === event.currentTarget && !isLoading) onCancel()
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hierarchy-confirm-title"
      >
        <header className={styles.dialogHeader}>
          <div className={styles.dialogIcon}><Icon aria-hidden="true" /></div>
          <div className={styles.dialogHeading}>
            <p className={styles.dialogKicker}>{t('hierarchy.pageKicker')}</p>
            <h2 id="hierarchy-confirm-title" className={styles.dialogTitle}>{title}</h2>
          </div>
          <button type="button" onClick={onCancel} className={styles.iconButton} aria-label={t('hierarchy.cancel')} disabled={isLoading}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={styles.dialogBody}>
          <p className={styles.stateDescription}>{message}</p>
        </div>
        <footer className={styles.dialogFooter}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={styles.secondaryButton}
          >
            {t('hierarchy.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={destructive ? styles.dangerButton : styles.primaryButton}
          >
            {isLoading ? t('hierarchy.processing') : confirmLabel}
          </button>
        </footer>
      </motion.div>
    </div>
  )
}
