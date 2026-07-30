'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Download,
  FileCheck2,
  Loader2,
  Share2,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getFullUrl } from '@/lib/env'
import { useShareModalContext } from '@/core/providers/ShareModalProvider'
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

interface CertificateResponse {
  success: boolean
  certificate: CertificateListItem
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('common')
  const { openShareModal } = useShareModalContext()
  const certificateId = params.id as string
  const isPrintMode = searchParams.get('print') === '1'
  const downloadDocumentRef = useRef<HTMLDivElement | null>(null)

  const [certificate, setCertificate] = useState<CertificateListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hashCopied, setHashCopied] = useState(false)

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
    if (certificateId) {
      void fetchCertificate(certificateId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateId])

  async function fetchCertificate(id: string): Promise<void> {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/certificates/${id}`, {
        credentials: 'include',
      })
      const data = (await response.json().catch(() => ({}))) as Partial<CertificateResponse> & {
        error?: string
      }

      if (!response.ok || !data.success || !data.certificate) {
        throw new Error(data.error ?? t('certificates.errorLoad'))
      }

      setCertificate(data.certificate)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : t('certificates.errorUnknown'),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(): Promise<void> {
    if (!certificate) return

    const downloadElement = downloadDocumentRef.current
    if (!downloadElement) {
      setDownloadError(t('certificates.errorDownload'))
      return
    }

    try {
      setDownloadError(null)
      setIsDownloading(true)
      await downloadCertificatePdf({
        element: downloadElement,
        fileName: certificate.documentModel.fileName,
      })
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : t('certificates.errorDownload'),
      )
    } finally {
      setIsDownloading(false)
    }
  }

  function copyHash(): void {
    if (!certificate) return

    void navigator.clipboard.writeText(certificate.certificateHash)
    setHashCopied(true)
    setTimeout(() => setHashCopied(false), 3000)
  }

  function shareCertificate(): void {
    if (!certificate) return

    const url = getFullUrl(`/certificates/verify/${certificate.certificateHash}`)
    openShareModal({
      url,
      title: t('certificates.shareTitle', { title: certificate.courseTitle }),
      text: t('certificates.shareText', { title: certificate.courseTitle }),
      description: t('certificates.shareDescription', { issuer: certificate.issuerName }),
    })
  }

  if (loading) {
    if (isPrintMode) {
      return (
        <div
          className="flex min-h-screen items-center justify-center bg-white"
          data-certificate-print-ready="false"
        >
          <Loader2 className="h-12 w-12 animate-spin text-slate-500" />
        </div>
      )
    }

    return (
      <div className={styles.page} style={certificateVars}>
        <div className={styles.loadingState}>
          <div className={styles.loadingCard} role="status">
            <span className={styles.loadingIcon}>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </span>
            <div>
              <p className={styles.loadingTitle}>{t('certificates.loadingDetail')}</p>
              <p className={styles.loadingText}>Preparando el documento certificado.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    if (isPrintMode) {
      return (
        <div
          className="flex min-h-screen items-center justify-center bg-white px-8 text-center text-slate-600"
          data-certificate-print-ready="false"
        >
          {error ?? t('certificates.notFound')}
        </div>
      )
    }

    return (
      <div className={styles.page} style={certificateVars}>
        <main className={styles.detailMain}>
          <div className={styles.stateCard} role="alert">
            <span className={`${styles.stateIcon} ${styles.stateIconError}`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className={styles.stateTitle}>{t('certificates.detailErrorTitle')}</h1>
            <p className={styles.stateText}>{error ?? t('certificates.notFound')}</p>
            <button
              type="button"
              onClick={() => router.push('/certificates')}
              className={styles.primaryButton}
            >
              {t('certificates.backToCertificates')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (isPrintMode) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        data-certificate-print-ready="true"
      >
        <CertificateDocument model={certificate.documentModel} />
      </div>
    )
  }

  return (
    <div className={styles.page} style={certificateVars}>
      <main className={styles.detailMain}>
        <div className={styles.detailToolbar}>
          <button
            type="button"
            onClick={() => router.push('/certificates')}
            className={styles.backButton}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('certificates.backToCertificates')}
          </button>
          <span className={styles.toolbarLabel}>
            <span className={styles.toolbarDot} aria-hidden="true" />
            Credencial verificable de SofLIA
          </span>
        </div>

        <div className={styles.detailGrid}>
          <section className={styles.documentPanel} aria-label="Documento del certificado">
            <header className={styles.documentPanelHeader}>
              <span className={styles.documentLabel}>
                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                Documento certificado
              </span>
              <span className={styles.documentState}>
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Emitido
              </span>
            </header>
            <div className={styles.documentShell}>
              <CertificateDocumentViewport model={certificate.documentModel} />
            </div>
          </section>

          <aside className={styles.detailsCard}>
            <header className={styles.detailsHeader}>
              <span className={`${styles.statusBadge} ${styles.statusValid}`}>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {t('certificates.statusValid')}
              </span>
              <h1 className={styles.detailsTitle}>{certificate.courseTitle}</h1>
            </header>

            <div className={styles.detailsBody}>
              <div className={styles.metaList}>
                <MetaRow
                  icon={Building2}
                  label={t('certificates.labelIssuer')}
                  value={certificate.issuerName}
                />
                <MetaRow
                  icon={UserRound}
                  label={t('certificates.labelInstructor')}
                  value={certificate.instructorName}
                />
                <MetaRow
                  icon={CalendarDays}
                  label={t('certificates.labelIssuedAt')}
                  value={formatDate(certificate.issuedAt)}
                />
              </div>

              <div className={styles.divider} />

              <div className={styles.hashHeader}>
                <span className={styles.hashLabel}>
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('certificates.labelHash')}
                </span>
                <button
                  type="button"
                  onClick={copyHash}
                  className={styles.copyButton}
                  aria-label={t('certificates.copyHash')}
                >
                  {hashCopied ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className={styles.hashValue} title={certificate.certificateHash}>
                {certificate.certificateHash}
              </div>
              {hashCopied && <p className={styles.copied}>{t('certificates.hashCopied')}</p>}
              <p className={styles.hashHelper}>{t('certificates.hashDescription')}</p>

              <div className={styles.divider} />

              {downloadError && (
                <p className={styles.errorToast} role="alert">
                  {downloadError}
                </p>
              )}

              <div className={styles.actionStack}>
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={isDownloading}
                  className={styles.primaryButton}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isDownloading
                    ? t('certificates.generatingPdf')
                    : t('certificates.downloadPdf')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/certificates/verify/${certificate.certificateHash}`)
                  }
                  className={styles.secondaryButton}
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {t('certificates.verifyPublic')}
                </button>
                <button
                  type="button"
                  onClick={shareCertificate}
                  className={styles.secondaryButton}
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t('certificates.share')}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

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
          <CertificateDocument model={certificate.documentModel} />
        </div>
      </div>
    </div>
  )
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaIcon}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div>
        <p className={styles.metaLabel}>{label}</p>
        <p className={styles.metaValue} title={value}>
          {value}
        </p>
      </div>
    </div>
  )
}
