import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

export function HierarchyErrorBanner({
  error,
  onClose,
}: {
  error: string | null
  onClose: () => void
}) {
  const { t: tc } = useTranslation('common')
  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles.alert} ${styles.alertError}`}
      role="alert"
    >
      <AlertTriangle aria-hidden="true" />
      <p className={styles.alertCopy}>{error}</p>
      <button
        type="button"
        onClick={onClose}
        className={styles.compactButton}
      >
        {tc('actions.close')}
      </button>
    </motion.div>
  )
}
