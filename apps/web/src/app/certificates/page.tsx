'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Shield,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton'
import { LiaSidePanel } from '@/core/components/LiaSidePanel'
import { useCurrentOrganizationSlug } from '@/core/stores/organizationStore'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'

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
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function CertificatesPage() {
  const router = useRouter()
  const theme = useBusinessPanelTheme()
  const orgSlug = useCurrentOrganizationSlug()
  const { t } = useTranslation('common')
  const downloadDocumentRef = useRef<HTMLDivElement | null>(null)
  const [certificates, setCertificates] = useState<CertificateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadTarget, setDownloadTarget] = useState<CertificateListItem | null>(null)
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<string | null>(null)

  useEffect(() => {
    void fetchCertificates()
  }, [])

  async function fetchCertificates(): Promise<void> {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/certificates', {
        credentials: 'include',
      })

      const data = (await response.json().catch(() => ({}))) as Partial<CertificatesResponse> & {
        error?: string
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('certificates.errorLoad'))
      }

      setCertificates(data.certificates || [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : t('certificates.errorUnknown'))
    } finally {
      setLoading(false)
    }
  }

  const filteredCertificates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return certificates
    }

    return certificates.filter((certificate) =>
      [
        certificate.courseTitle,
        certificate.instructorName,
        certificate.issuerName,
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    )
  }, [certificates, searchTerm])

  async function waitForDownloadRender(): Promise<void> {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
  }

  async function handleDownload(certificate: CertificateListItem): Promise<void> {
    try {
      setDownloadError(null)
      setDownloadTarget(certificate)
      setDownloadingCertificateId(certificate.certificateId)

      await waitForDownloadRender()

      const downloadElement = downloadDocumentRef.current
      if (!downloadElement) {
        throw new Error(t('certificates.errorDownload'))
      }

      await downloadCertificatePdf({
        element: downloadElement,
        fileName: certificate.documentModel.fileName,
      })
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t('certificates.errorDownload'))
    } finally {
      setDownloadingCertificateId(null)
      setDownloadTarget(null)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.panelBg }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.actionColor }} />
          <p style={{ color: theme.subtextColor }}>{t('certificates.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: theme.panelBg }}
      >
        <div
          className="max-w-md rounded-[24px] border p-8 text-center"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold" style={{ color: theme.textColor }}>
            {t('certificates.errorTitle')}
          </h1>
          <p className="mb-6" style={{ color: theme.subtextColor }}>
            {error}
          </p>
          <button
            onClick={() => void fetchCertificates()}
            className="rounded-2xl px-5 py-3 font-semibold"
            style={{
              backgroundColor: theme.actionColor,
              color: theme.onActionColor,
            }}
          >
            {t('certificates.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.panelBg,
        color: theme.textColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <button
          onClick={() => router.push(orgSlug ? `/${orgSlug}/business-user/dashboard` : '/dashboard')}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('certificates.backToPanel')}
        </button>

        <section
          className="rounded-[28px] border p-6 md:p-8"
          style={{
            background: theme.heroBackground,
            borderColor: theme.heroBorderColor,
            color: theme.inverseTextColor,
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  backgroundColor: theme.inverseSurface,
                  borderColor: theme.inverseBorderColor,
                  color: theme.inverseSubtextColor,
                }}
              >
                {t('certificates.badge')}
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {t('certificates.pageTitle')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base" style={{ color: theme.inverseSubtextColor }}>
                {t('certificates.pageSubtitle')}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black" style={{ color: theme.textColor }}>
              {t('certificates.sectionTitle')}
            </h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
              {t(certificates.length === 1 ? 'certificates.sectionCount_one' : 'certificates.sectionCount_other', { count: certificates.length })}
            </p>
          </div>

          <BusinessPanelSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('certificates.searchPlaceholder')}
            className="w-full md:max-w-xl"
          />
        </section>

        {downloadError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
            <span>{downloadError}</span>
            <button onClick={() => setDownloadError(null)} className="ml-4 text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {filteredCertificates.length === 0 ? (
          <div
            className="mt-10 rounded-[28px] border p-10 text-center"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            }}
          >
            <Award className="mx-auto mb-5 h-14 w-14" style={{ color: theme.mutedTextColor }} />
            <h3 className="text-2xl font-black" style={{ color: theme.textColor }}>
              {certificates.length === 0 ? t('certificates.emptyTitle') : t('certificates.noResultsTitle')}
            </h3>
            <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
              {certificates.length === 0
                ? t('certificates.emptyText')
                : t('certificates.noResultsText')}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredCertificates.map((certificate) => (
              <article
                key={certificate.certificateId}
                className="overflow-hidden rounded-[28px] border transition-transform duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                  boxShadow: theme.isDark
                    ? '0 20px 40px -24px rgba(0,0,0,0.65)'
                    : '0 20px 40px -28px rgba(15,23,42,0.18)',
                }}
              >
                <div
                  className="flex items-center justify-center border-b p-5"
                  style={{
                    borderColor: theme.borderColor,
                    backgroundColor: theme.inputBg,
                  }}
                >
                  <CertificateDocumentPreview model={certificate.documentModel} />
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black leading-tight" style={{ color: theme.textColor }}>
                        {certificate.courseTitle}
                      </h3>
                      <p className="mt-2 text-sm font-medium" style={{ color: theme.subtextColor }}>
                        {t('certificates.issuedBy', { name: certificate.issuerName })}
                      </p>
                    </div>
                    <div
                      className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold"
                      style={{
                        backgroundColor: `${theme.successColor}18`,
                        color: theme.successColor,
                      }}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-3 text-sm" style={{ color: theme.subtextColor }}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{certificate.issuerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      <span>{certificate.instructorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t('certificates.issuedOn', { date: formatDate(certificate.issuedAt) })}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push(`/certificates/${certificate.certificateId}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                      style={{
                        backgroundColor: theme.actionColor,
                        color: theme.onActionColor,
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      {t('certificates.view')}
                    </button>
                    <button
                      onClick={() => void handleDownload(certificate)}
                      disabled={downloadingCertificateId !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    >
                      {downloadingCertificateId === certificate.certificateId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {downloadingCertificateId === certificate.certificateId
                        ? t('certificates.generatingPdf')
                        : t('certificates.download')}
                    </button>
                    <button
                      onClick={() => router.push(`/certificates/verify/${certificate.certificateHash}`)}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    >
                      <Shield className="h-4 w-4" />
                      {t('certificates.verifyValidity')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

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

      <LiaSidePanel />
      <LiaFloatingButton />
    </div>
  )
}
