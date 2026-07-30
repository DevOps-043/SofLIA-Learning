'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CirclePlay, ClipboardCheck, ShieldAlert, X } from 'lucide-react'

import styles from './LearnPageValidationModal.module.css'

interface LearnPageValidationModalProps {
  isOpen: boolean
  type: string
  title: string
  message: string
  details?: string | null
  onClose: () => void
}

export function LearnPageValidationModal({
  isOpen,
  type,
  title,
  message,
  details,
  onClose,
}: LearnPageValidationModalProps) {
  const isActivityOrQuiz = type === 'activity' || type === 'quiz'
  const isVideo = type === 'video'
  const Icon = isActivityOrQuiz ? ClipboardCheck : isVideo ? CirclePlay : ShieldAlert
  const eyebrow = isVideo
    ? 'Progreso de la lección'
    : isActivityOrQuiz
      ? 'Actividad pendiente'
      : 'Antes de continuar'

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className={styles.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-labelledby="learn-validation-title"
            aria-modal="true"
            className={styles.dialog}
            data-kind={isVideo ? 'video' : isActivityOrQuiz ? 'activity' : 'default'}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              aria-label="Cerrar"
              className={styles.closeButton}
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <span className={styles.icon} aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h3 className={styles.title} id="learn-validation-title">
              {title}
            </h3>
            <p className={styles.message}>{message}</p>

            {details ? <p className={styles.details}>{details}</p> : null}

            <button className={styles.primaryButton} onClick={onClose} type="button">
              Entendido
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
