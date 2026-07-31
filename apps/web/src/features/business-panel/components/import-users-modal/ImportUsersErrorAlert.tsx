'use client'

import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'

import styles from '../AdministrativeModal.module.css'

export function ImportUsersErrorAlert({
  error,
  onDismiss,
}: {
  error: string | null
  onDismiss: () => void
}) {
  if (!error) return null

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.alert}
      initial={{ opacity: 0, y: -8 }}
      role="alert"
    >
      <AlertCircle aria-hidden="true" />
      <span className="flex-1">{error}</span>
      <button aria-label="Cerrar aviso" onClick={onDismiss} type="button">
        <X aria-hidden="true" />
      </button>
    </motion.div>
  )
}
