'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Download,
  Eye,
  Loader2,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LiaPanelMount } from '@/core/components/LiaSidePanel/LiaPanelMount'
import { OrgNavbar } from '@/core/components/OrgNavbar/OrgNavbar'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'
import { CertificateDocumentViewport } from '@/features/certificates/components/CertificateDocumentViewport'
import styles from '@/features/certificates/components/CertificateExperience.module.css'
import { downloadCertificatePdf } from '@/features/certificates/services/certificate-client-pdf.service'
import {
  CERTIFICATE_RENDER_HEIGHT_PX,
  CERTIFICATE_RENDER_WIDTH_PX,
} from '@/features/certificates/constants/certificate-branding'
import type { CertificateListItem } from '@/features/certificates/types/certificate'

interface CertificatesResponse {
  success: boolean
  certificates: CertificateListItem[]
  count: number
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function OrgCertificatesPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('common')
  const downloadDocumentRef = useRef<HTMLDivElement | null>(null)
  const [certificates, setCertificates] = useState<CertificateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadTarget, setDownloadTarget] = useState<CertificateListItem | null>(null)
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<string | null>(null)

  const certificateVars = {
    '--certificate-action': theme.actionColor,
    '--certificate-on-action': theme.onActionColor,
    '--certificate-accent': theme.accentColor,
    '--certificate-surface': theme.panelBg,
    '--certificate-card': theme.cardBg,
    '--certificate-inner': theme.inputBg,
    '--certificate-border': theme.borderColor,
    '--certificate-text': theme.textColor,
    '--certificate-muted': theme.subtextColor,
  } as CSSProperties

  useEffect(() => {
    void fetchCertificates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug])

  async function fetchCertificates(): Promise<void> {
    if (!orgSlug) return
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/${orgSlug}/business-user/certificates`, {
        credentials: 'include',
      })
      const data = (await response.json().catch(() => ({}))) as Partial<CertificatesResponse> & {
        error?: string
      }
      if (!response.ok || !data.success) throw new Error(data.error ?? t('certificates.errorLoad'))
      setCertificates(data.certificates ?? [])
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : t('certificates.errorUnknown'),
      )
    } finally {
      setLoading(false)
    }
  }

  async function waitForDownloadRender(): Promise<void> {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  }

  async function handleDownload(certificate: CertificateListItem): Promise<void> {
    try {
      setDownloadError(null)
      setDownloadTarget(certificate)
      setDownloadingCertificateId(certificate.certificateId)
      await waitForDownloadRender()
      const element = downloadDocumentRef.current
      if (!element) throw new Error(t('certificates.errorDownload'))
      await downloadCertificatePdf({
        element,
        fileName: certificate.documentModel.fileName,
      })
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : t('certificates.errorDownload'),
      )
    } finally {
      setDownloadingCertificateId(null)
      setDownloadTarget(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.page} style={certificateVars}>
        <OrgNavbar />
        <div className={styles.loadingState}>
          <div className={styles.loadingCard} role="status">
            <span className={styles.loadingIcon}>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </span>
            <div>
              <p className={styles.loadingTitle}>{t('certificates.loading')}</p>
              <p className={styles.loadingText}>Preparando tus credenciales verificables.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page} style={certificateVars}>
        <OrgNavbar />
        <main className={styles.main}>
          <div className={styles.stateCard} role="alert">
            <span className={`${styles.stateIcon} ${styles.stateIconError}`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className={styles.stateTitle}>{t('certificates.errorTitle')}</h1>
            <p className={styles.stateText}>{error}</p>
            <button
              type="button"
              onClick={() => void fetchCertificates()}
              className={styles.primaryButton}
            >
              {t('certificates.retry')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page} style={certificateVars}>
      <OrgNavbar />

      <main className={styles.main}>
        <button
          type="button"
          onClick={() => router.push(`/${orgSlug}/business-user/dashboard`)}
          className={styles.backButton}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('certificates.backToPanel')}
        </button>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('certificates.badge')}
            </p>
            <h1 className={styles.heroTitle}>{t('certificates.pageTitle')}</h1>
          </div>
        </section>

        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('certificates.sectionTitle')}</h2>
        </header>

        {downloadError && (
          <div className={styles.errorToast} role="alert">
            <span>{downloadError}</span>
            <button
              type="button"
              onClick={() => setDownloadError(null)}
              className={styles.toastClose}
              aria-label="Cerrar mensaje"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {certificates.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.stateIcon}>
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className={styles.emptyTitle}>{t('certificates.emptyTitle')}</h3>
            <p className={styles.emptyText}>{t('certificates.emptyText')}</p>
          </div>
        ) : (
          <div className={styles.certificateGrid}>
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.certificateId}
                certificate={certificate}
                t={t}
                downloadingId={downloadingCertificateId}
                onView={() => router.push(`/certificates/${certificate.certificateId}`)}
                onDownload={() => void handleDownload(certificate)}
                onVerify={() =>
                  router.push(`/certificates/verify/${certificate.certificateHash}`)
                }
              />
            ))}
          </div>
        )}
      </main>

      {downloadTarget ? (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-10000px',
            width: `${CERTIFICATE_RENDER_WIDTH_PX}px`,
            height: `${CERTIFICATE_RENDER_HEIGHT_PX}px`,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div ref={downloadDocumentRef}>
            <CertificateDocument model={downloadTarget.documentModel} />
          </div>
        </div>
      ) : null}

      <LiaPanelMount />
    </div>
  )
}

interface CertificateCardProps {
  certificate: CertificateListItem
  t: (key: string, opts?: Record<string, unknown>) => string
  downloadingId: string | null
  onView: () => void
  onDownload: () => void
  onVerify: () => void
}

function CertificateCard({
  certificate,
  t,
  downloadingId,
  onView,
  onDownload,
  onVerify,
}: CertificateCardProps) {
  const isDownloading = downloadingId === certificate.certificateId
  const isAnyDownloading = downloadingId !== null

  return (
    <article className={styles.certificateCard}>
      <div className={styles.cardAccent} aria-hidden="true" />

      <div className={styles.previewStage}>
        <div className={styles.previewFrame}>
          <CertificateDocumentViewport model={certificate.documentModel} />
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.issuerRow}>
          <span className={styles.issuerBadge}>{certificate.issuerName}</span>
          <span className={styles.validBadge}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('certificates.statusValid')}
          </span>
        </div>

        <h3 className={styles.cardTitle}>{certificate.courseTitle}</h3>

        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <UserRound className="h-3 w-3" aria-hidden="true" />
            {certificate.instructorName}
          </span>
          <span className={styles.metaItem}>
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatDate(certificate.issuedAt)}
          </span>
        </div>

        <div className={styles.cardActions}>
          <button type="button" onClick={onView} className={styles.primaryButton}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {t('certificates.view')}
          </button>

          <button
            type="button"
            onClick={onDownload}
            disabled={isAnyDownloading}
            title={t('certificates.download')}
            className={styles.iconButton}
            aria-label={t('certificates.download')}
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onVerify}
            title={t('certificates.verifyValidity')}
            className={styles.iconButton}
            aria-label={t('certificates.verifyValidity')}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}
