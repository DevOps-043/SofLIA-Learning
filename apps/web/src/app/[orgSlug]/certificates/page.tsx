'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Shield,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LiaPanelMount } from '@/core/components/LiaSidePanel/LiaPanelMount'
import { OrgNavbar } from '@/core/components/OrgNavbar/OrgNavbar'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'
import { CertificateDocumentPreview } from '@/features/certificates/components/CertificateDocumentPreview'
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
      const el = downloadDocumentRef.current
      if (!el) throw new Error(t('certificates.errorDownload'))
      await downloadCertificatePdf({ element: el, fileName: certificate.documentModel.fileName })
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t('certificates.errorDownload'))
    } finally {
      setDownloadingCertificateId(null)
      setDownloadTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.panelBg }}>
        <OrgNavbar />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.actionColor }} />
            <p className="text-sm" style={{ color: theme.subtextColor }}>
              {t('certificates.loading')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.panelBg }}>
        <OrgNavbar />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
          <div
            className="max-w-md rounded-[24px] border p-8 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-xl font-bold" style={{ color: theme.textColor }}>
              {t('certificates.errorTitle')}
            </h1>
            <p className="mb-6 text-sm" style={{ color: theme.subtextColor }}>
              {error}
            </p>
            <button
              onClick={() => void fetchCertificates()}
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
            >
              {t('certificates.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.panelBg, color: theme.textColor }}>
      <OrgNavbar />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${orgSlug}/business-user/dashboard`)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            color: theme.subtextColor,
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('certificates.backToPanel')}
        </button>

        {/* Hero */}
        <section
          className="rounded-[24px] border px-6 py-7 md:px-10 md:py-8"
          style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}
        >
          <div
            className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              backgroundColor: theme.inverseSurface,
              borderColor: theme.inverseBorderColor,
              color: theme.inverseSubtextColor,
            }}
          >
            <Award className="h-3 w-3" />
            {t('certificates.badge')}
          </div>
          <h1
            className="text-2xl font-black tracking-tight md:text-4xl"
            style={{ color: theme.inverseTextColor }}
          >
            {t('certificates.pageTitle')}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: theme.inverseSubtextColor }}>
            {t('certificates.pageSubtitle')}
          </p>
        </section>

        {/* Section header */}
        <div className="mt-8 flex items-baseline gap-2">
          <h2 className="text-base font-bold" style={{ color: theme.textColor }}>
            {t('certificates.sectionTitle')}
          </h2>
          <span className="text-sm" style={{ color: theme.subtextColor }}>
            ·{' '}
            {t(
              certificates.length === 1
                ? 'certificates.sectionCount_one'
                : 'certificates.sectionCount_other',
              { count: certificates.length },
            )}
          </span>
        </div>

        {/* Download error */}
        {downloadError && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>{downloadError}</span>
            <button onClick={() => setDownloadError(null)} className="ml-4 opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        )}

        {/* Empty state */}
        {certificates.length === 0 ? (
          <div
            className="mt-8 rounded-[24px] border p-12 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <Award
              className="mx-auto mb-4 h-12 w-12 opacity-30"
              style={{ color: theme.textColor }}
            />
            <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>
              {t('certificates.emptyTitle')}
            </h3>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
              {t('certificates.emptyText')}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.certificateId}
                certificate={certificate}
                theme={theme}
                t={t}
                downloadingId={downloadingCertificateId}
                onView={() =>
                  router.push(`/certificates/${certificate.certificateId}`)
                }
                onDownload={() => void handleDownload(certificate)}
                onVerify={() =>
                  router.push(`/certificates/verify/${certificate.certificateHash}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden download canvas */}
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
  theme: ReturnType<typeof useBusinessPanelTheme>
  t: (key: string, opts?: Record<string, unknown>) => string
  downloadingId: string | null
  onView: () => void
  onDownload: () => void
  onVerify: () => void
}

function CertificateCard({
  certificate,
  theme,
  t,
  downloadingId,
  onView,
  onDownload,
  onVerify,
}: CertificateCardProps) {
  const isDownloading = downloadingId === certificate.certificateId
  const isAnyDownloading = downloadingId !== null

  return (
    <article
      className="group overflow-hidden rounded-[20px] border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        boxShadow: theme.isDark
          ? '0 4px 24px -8px rgba(0,0,0,0.5)'
          : '0 4px 24px -8px rgba(15,23,42,0.10)',
      }}
    >
      <div
        style={{
          height: '3px',
          background: `linear-gradient(90deg, ${theme.brandColor}, ${theme.accentColor})`,
        }}
      />

      <div
        className="flex items-center justify-center px-5 pb-4 pt-5"
        style={{ backgroundColor: theme.inputBg }}
      >
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            boxShadow: theme.isDark
              ? '0 8px 32px -8px rgba(0,0,0,0.6)'
              : '0 8px 32px -8px rgba(15,23,42,0.18)',
          }}
        >
          <CertificateDocumentPreview model={certificate.documentModel} scale={0.24} />
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
          >
            {certificate.issuerName}
          </span>
          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: theme.successColor }} />
        </div>

        <h3 className="line-clamp-2 text-sm font-bold leading-snug" style={{ color: theme.textColor }}>
          {certificate.courseTitle}
        </h3>

        <p className="mt-1.5 truncate text-xs" style={{ color: theme.subtextColor }}>
          {certificate.instructorName}
          <span className="mx-1.5 opacity-40">·</span>
          {formatDate(certificate.issuedAt)}
        </p>

        <div className="my-3" style={{ height: '1px', backgroundColor: theme.borderColor }} />

        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('certificates.view')}
          </button>

          <button
            onClick={onDownload}
            disabled={isAnyDownloading}
            title={t('certificates.download')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            onClick={onVerify}
            title={t('certificates.verifyValidity')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-opacity hover:opacity-70"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.subtextColor,
            }}
          >
            <Shield className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
