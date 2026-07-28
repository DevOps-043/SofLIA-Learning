'use client'

import { ChevronDown, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatMarkdownBold,
  parseReleaseNotes,
} from '../../services/downloads-page.service'
import type { ReleaseChangelog } from '../../types'
import styles from './pulse-hub.module.css'

interface PulseHubChangelogModalProps {
  isOpen: boolean
  changelogs: ReleaseChangelog[]
  expandedVersions: Record<string, boolean>
  onToggleVersion: (version: string) => void
  onClose: () => void
}

export function PulseHubChangelogModal({
  isOpen,
  changelogs,
  expandedVersions,
  onToggleVersion,
  onClose,
}: PulseHubChangelogModalProps) {
  const { t } = useTranslation('hub')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    closeButtonRef.current?.focus()
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.documentElement.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div className={styles.modalWrap} onClick={onClose}>
            <motion.div
              className={styles.modalPanel}
              role="dialog"
              aria-modal="true"
              aria-label={t('changelog.title')}
              initial={{ opacity: 0, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
            >
              <header className={styles.modalHeader}>
                <div>
                  <h2>{t('changelog.title')}</h2>
                  <p>{t('changelog.subtitle')}</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className={styles.modalClose}
                  onClick={onClose}
                  aria-label={t('changelog.close')}
                >
                  <X size={17} />
                </button>
              </header>

              <div className={styles.modalBody}>
                {changelogs.length === 0 ? (
                  <p className={styles.modalEmpty}>{t('changelog.empty')}</p>
                ) : (
                  changelogs.map((entry) => {
                    const isExpanded = Boolean(expandedVersions[entry.version])
                    const parsed = parseReleaseNotes(entry.notes)
                    const sections = parsed.sections.filter(
                      (section) => section.items.length > 0,
                    )

                    return (
                      <div key={entry.version} className={styles.versionRow}>
                        <button
                          type="button"
                          className={styles.versionToggle}
                          onClick={() => onToggleVersion(entry.version)}
                          aria-expanded={isExpanded}
                          aria-label={t('changelog.toggleVersion', {
                            version: entry.version,
                          })}
                        >
                          <span className={styles.versionTag}>{entry.version}</span>
                          <span className={styles.versionDate}>{entry.date}</span>
                          <motion.span
                            className={styles.versionChevron}
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            aria-hidden="true"
                          >
                            <ChevronDown size={16} />
                          </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className={styles.versionContent}>
                                {sections.length === 0 ? (
                                  <p className={styles.modalEmpty}>
                                    {t('changelog.empty')}
                                  </p>
                                ) : (
                                  sections.map((section) => (
                                    <div
                                      key={section.key}
                                      className={styles.versionSection}
                                    >
                                      <h4>{section.label}</h4>
                                      <ul>
                                        {section.items.map((item) => (
                                          <li
                                            key={item}
                                            /* formatMarkdownBold escapes HTML before injecting <strong>. */
                                            dangerouslySetInnerHTML={{
                                              __html: formatMarkdownBold(item),
                                            }}
                                          />
                                        ))}
                                      </ul>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
