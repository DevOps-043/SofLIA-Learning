'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout, Plus, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './HierarchyExperience.module.css'
import { useHierarchyDialog } from './useHierarchyDialog'

interface StructureFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
}

export function StructureForm({ isOpen, onClose, onSave }: StructureFormModalProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dialogRef = useHierarchyDialog({ isOpen, onClose, preventClose: loading })

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setLoading(false)
    setSaveError(null)
  }, [isOpen])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedName = name.trim()
    if (!normalizedName || loading) return

    setLoading(true)
    setSaveError(null)
    try {
      await onSave(normalizedName)
      onClose()
    } catch (error) {
      techDebtLogger.error(error)
      setSaveError(t('hierarchy.saveStructureError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={event => {
            if (event.target === event.currentTarget && !loading) onClose()
          }}
        >
          <motion.div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="structure-form-title"
            initial={{ opacity: 0, scale: 0.975, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.975, y: 18 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className={styles.dialogHeader}>
              <div className={styles.dialogIcon}><Layout aria-hidden="true" /></div>
              <div className={styles.dialogHeading}>
                <p className={styles.dialogKicker}>{t('hierarchy.structureForm.sideTitle')}</p>
                <h2 id="structure-form-title" className={styles.dialogTitle}>{t('hierarchy.structureForm.title')}</h2>
                <p className={styles.dialogDescription}>{t('hierarchy.structureForm.sideDescription')}</p>
              </div>
              <button type="button" onClick={onClose} disabled={loading} className={styles.iconButton} aria-label={tc('actions.close')}>
                <X aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className={styles.dialogBody}>
                <div className={styles.formStack}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>{t('hierarchy.structureForm.fields.name')}</span>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      placeholder={t('hierarchy.structureForm.placeholders.name')}
                      className={styles.input}
                      aria-invalid={Boolean(saveError)}
                    />
                  </label>
                  {saveError ? <p className={styles.formError}>{saveError}</p> : null}
                </div>
              </div>
              <footer className={styles.dialogFooter}>
                <button type="button" onClick={onClose} disabled={loading} className={styles.secondaryButton}>
                  {tc('actions.cancel')}
                </button>
                <button type="submit" disabled={loading || !name.trim()} className={styles.primaryButton}>
                  <Plus aria-hidden="true" />
                  {loading ? tc('actions.saving') : t('hierarchy.newStructure')}
                </button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
