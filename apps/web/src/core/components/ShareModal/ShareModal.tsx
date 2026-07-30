'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Check,
  Copy,
  Facebook,
  Link2,
  Mail,
  Share2,
  Twitter,
  X,
  type LucideIcon,
} from 'lucide-react'
import styles from './ShareModal.module.css'

export interface ShareData {
  url: string
  title?: string
  text?: string
  description?: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareData: ShareData | null
}

interface ShareOption {
  name: string
  hint: string
  icon: LucideIcon
  action: () => void | Promise<void>
  primary?: boolean
}

export function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!shareData) return null

  const { url, title, text, description } = shareData
  const shareText = text || description || title || 'Mira esto'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToTwitter = () => {
    const twitterUrl =
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` +
      `&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const shareToFacebook = () => {
    const facebookUrl =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const shareByEmail = () => {
    const subject = title || 'Compartir contenido'
    const body = `${shareText}\n\nVer más: ${url}`
    window.location.href =
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const shareOptions: ShareOption[] = [
    {
      name: copied ? 'Enlace copiado' : 'Copiar enlace',
      hint: copied ? 'Listo para compartir' : 'Guárdalo en el portapapeles',
      icon: Copy,
      action: copyToClipboard,
      primary: true,
    },
    {
      name: 'Compartir en X',
      hint: 'Publicar credencial',
      icon: Twitter,
      action: shareToTwitter,
    },
    {
      name: 'Facebook',
      hint: 'Compartir publicación',
      icon: Facebook,
      action: shareToFacebook,
    },
    {
      name: 'Enviar por email',
      hint: 'Abrir correo electrónico',
      icon: Mail,
      action: shareByEmail,
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.overlay}
            onClick={onClose}
          />

          <div className={styles.viewport}>
            <motion.section
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-modal-title"
            >
              <header className={styles.header}>
                <span className={styles.headerIcon}>
                  <Share2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className={styles.eyebrow}>Compartir credencial</p>
                  <h2 id="share-modal-title" className={styles.title}>
                    Comparte este logro
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.closeButton}
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </header>

              <div className={styles.body}>
                {title && (
                  <p className={styles.shareSummary}>
                    <strong>{title}</strong>
                    {description ? ` · ${description}` : ''}
                  </p>
                )}

                <div className={styles.options}>
                  {shareOptions.map((option, index) => (
                    <motion.button
                      key={option.name}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.04, duration: 0.2 }}
                      onClick={() => {
                        void option.action()
                        if (!option.primary) setTimeout(onClose, 300)
                      }}
                      className={`${styles.option} ${
                        option.primary ? styles.optionPrimary : ''
                      }`}
                    >
                      <span className={styles.optionIcon}>
                        <option.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>
                        <span className={styles.optionName}>{option.name}</span>
                        <span className={styles.optionHint}>{option.hint}</span>
                      </span>
                      <span
                        className={`${styles.optionEnd} ${
                          option.primary && copied ? styles.optionEndSuccess : ''
                        }`}
                      >
                        {option.primary && copied ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <div className={styles.linkPanel}>
                  <span className={styles.linkIcon}>
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <span className={styles.linkLabel}>Enlace público de verificación</span>
                    <span className={styles.linkValue} title={url}>
                      {url}
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
