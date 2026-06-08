'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Copy,
  Download,
  Loader2,
  Share2,
  Shield,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getFullUrl } from '@/lib/env'
import { useShareModalContext } from '@/core/providers/ShareModalProvider'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'
import { CertificateDocumentViewport } from '@/features/certificates/components/CertificateDocumentViewport'
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

  useEffect(() => {
    if (certificateId) {
      void fetchCertificate(certificateId)
    }
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
      setError(fetchError instanceof Error ? fetchError.message : t('certificates.errorUnknown'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(): Promise<void> {
    if (!certificate) {
      return
    }

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
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t('certificates.errorDownload'))
    } finally {
      setIsDownloading(false)
    }
  }

  function copyHash(): void {
    if (!certificate) {
      return
    }

    void navigator.clipboard.writeText(certificate.certificateHash)
    setHashCopied(true)
    setTimeout(() => setHashCopied(false), 3000)
  }

  function shareCertificate(): void {
    if (!certificate) {
      return
    }

    // Usamos SIEMPRE el modal propio (marca consistente y comportamiento
    // predecible). Antes se priorizaba `navigator.share` (Web Share API), que en
    // Windows abre el panel nativo del SO y en algunos navegadores de Mac no
    // despliega nada, dando la sensacion de que el boton no responde.
    const url = getFullUrl(`/certificates/verify/${certificate.certificateHash}`)
    const title = t('certificates.shareTitle', { title: certificate.courseTitle })
    const text = t('certificates.shareText', { title: certificate.courseTitle })

    openShareModal({
      url,
      title,
      text,
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.panelBg }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: theme.actionColor }} />
          <p style={{ color: theme.subtextColor }}>{t('certificates.loadingDetail')}</p>
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
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: theme.panelBg }}>
        <div
          className="max-w-lg rounded-[28px] border p-8 text-center"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-black" style={{ color: theme.textColor }}>
            {t('certificates.detailErrorTitle')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
            {error ?? t('certificates.notFound')}
          </p>
          <button
            onClick={() => router.push('/certificates')}
            className="mt-6 rounded-2xl px-5 py-3 font-semibold"
            style={{
              backgroundColor: theme.actionColor,
              color: theme.onActionColor,
            }}
          >
            {t('certificates.backToCertificates')}
          </button>
        </div>
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
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: theme.panelBg,
        color: theme.textColor,
      }}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-10">
        <button
          onClick={() => router.push('/certificates')}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('certificates.backToCertificates')}
        </button>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_332px]">
          <section
            className="min-w-0 rounded-[28px] border p-5 md:p-6"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              boxShadow: theme.isDark
                ? '0 20px 40px -24px rgba(0,0,0,0.65)'
                : '0 20px 40px -28px rgba(15,23,42,0.18)',
            }}
          >
            <div
              className="rounded-[24px] border p-4 md:p-5"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
              }}
            >
              <CertificateDocumentViewport model={certificate.documentModel} />
            </div>
          </section>

          <aside className="min-w-0">
            <section
              className="rounded-[28px] border p-5"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
            >
              {/* Status + title */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.successColor} 9.4%, transparent)`,
                  color: theme.successColor,
                }}
              >
                <Shield className="h-3 w-3" />
                {t('certificates.statusValid')}
              </div>

              <h1
                className="mt-3 line-clamp-3 text-lg font-black leading-snug"
                style={{ color: theme.textColor }}
              >
                {certificate.courseTitle}
              </h1>

              {/* Meta compact */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.subtextColor }} />
                  <span className="text-xs" style={{ color: theme.subtextColor }}>
                    <span className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.labelIssuer')}:
                    </span>{' '}
                    {certificate.issuerName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserRound className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.subtextColor }} />
                  <span className="text-xs" style={{ color: theme.subtextColor }}>
                    <span className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.labelInstructor')}:
                    </span>{' '}
                    {certificate.instructorName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.subtextColor }} />
                  <span className="text-xs" style={{ color: theme.subtextColor }}>
                    <span className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.labelIssuedAt')}:
                    </span>{' '}
                    {formatDate(certificate.issuedAt)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t" style={{ borderColor: theme.borderColor }} />

              {/* Hash compact */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" style={{ color: theme.actionColor }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: theme.subtextColor }}
                  >
                    {t('certificates.labelHash')}
                  </span>
                </div>
                <button
                  onClick={copyHash}
                  className="rounded-lg border p-1.5"
                  style={{
                    borderColor: theme.borderColor,
                    backgroundColor: theme.inputBg,
                    color: theme.textColor,
                  }}
                  aria-label={t('certificates.copyHash')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div
                className="truncate rounded-xl border px-3 py-2 font-mono text-[10px]"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              >
                {certificate.certificateHash}
              </div>
              {hashCopied && (
                <p className="mt-1.5 text-[11px] text-green-400">{t('certificates.hashCopied')}</p>
              )}
              <p className="mt-2 text-[11px] leading-4" style={{ color: theme.subtextColor }}>
                {t('certificates.hashDescription')}
              </p>

              {/* Divider */}
              <div className="my-4 border-t" style={{ borderColor: theme.borderColor }} />

              {/* Actions */}
              {downloadError && (
                <p className="mb-2 text-xs text-red-400">{downloadError}</p>
              )}
              <div className="grid gap-2">
                <button
                  onClick={() => void handleDownload()}
                  disabled={isDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    backgroundColor: theme.actionColor,
                    color: theme.onActionColor,
                  }}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloading ? t('certificates.generatingPdf') : t('certificates.downloadPdf')}
                </button>
                <button
                  onClick={() => router.push(`/certificates/verify/${certificate.certificateHash}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                >
                  <Shield className="h-4 w-4" />
                  {t('certificates.verifyPublic')}
                </button>
                <button
                  onClick={() => void shareCertificate()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  {t('certificates.share')}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

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
