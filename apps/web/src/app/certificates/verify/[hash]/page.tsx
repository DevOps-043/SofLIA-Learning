'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { CertificateDocumentViewport } from '@/features/certificates/components/CertificateDocumentViewport'
import type { CertificateVerificationResult } from '@/features/certificates/types/certificate'

export default function CertificateVerifyPage() {
  const params = useParams()
  const router = useRouter()
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('common')
  const hash = params.hash as string

  const [loading, setLoading] = useState(true)
  const [validation, setValidation] = useState<CertificateVerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hashCopied, setHashCopied] = useState(false)

  useEffect(() => {
    if (!hash || hash === '[hash]') {
      setLoading(false)
      setError(t('certificates.invalidHash'))
      return
    }

    void validateCertificate(hash)
  }, [hash])

  async function validateCertificate(certificateHash: string): Promise<void> {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/certificates/verify/${certificateHash}`)
      const data = (await response.json().catch(() => ({}))) as Partial<CertificateVerificationResult> & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? t('certificates.errorValidate'))
      }

      setValidation(data as CertificateVerificationResult)
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : t('certificates.errorUnknown'))
    } finally {
      setLoading(false)
    }
  }

  function copyHash(): void {
    if (!validation) {
      return
    }

    void navigator.clipboard.writeText(validation.certificate.certificateHash)
    setHashCopied(true)
    setTimeout(() => setHashCopied(false), 3000)
  }

  const isValid = Boolean(validation?.valid && !validation.expired && validation.chainOk)

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: theme.panelBg,
        color: theme.textColor,
      }}
    >
      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-10">
        <button
          onClick={() => router.push('/certificates')}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('certificates.myCertificates')}
        </button>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin" style={{ color: theme.actionColor }} />
              <p style={{ color: theme.subtextColor }}>{t('certificates.loadingValidation')}</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-[28px] border p-8 text-center"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            }}
          >
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-black" style={{ color: theme.textColor }}>
              {t('certificates.validateErrorTitle')}
            </h2>
            <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
              {error}
            </p>
            <button
              onClick={() => void validateCertificate(hash)}
              className="mt-6 rounded-2xl px-5 py-3 font-semibold"
              style={{
                backgroundColor: theme.actionColor,
                color: theme.onActionColor,
              }}
            >
              {t('certificates.retry')}
            </button>
          </div>
        ) : validation ? (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* On mobile: certificate viewport first (order-1), info aside second (order-2) */}
            {/* On desktop xl: aside left (order-1), certificate right (order-2) */}
            <aside className="min-w-0 order-2 xl:order-1">
              <section
                className="rounded-[28px] border p-5"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
              >
                {/* Status badge */}
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    backgroundColor: isValid ? `color-mix(in srgb, ${theme.successColor} 9.4%, transparent)` : `color-mix(in srgb, ${theme.dangerColor} 9.4%, transparent)`,
                    color: isValid ? theme.successColor : theme.dangerColor,
                  }}
                >
                  {isValid ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                  {isValid
                    ? t('certificates.statusValid')
                    : validation.expired
                      ? t('certificates.statusExpired')
                      : t('certificates.statusInvalid')}
                </div>

                {/* Title */}
                <h2
                  className="mt-3 line-clamp-3 text-lg font-black leading-snug"
                  style={{ color: theme.textColor }}
                >
                  {validation.certificate.courseTitle}
                </h2>

                {/* Status description */}
                <p className="mt-2 text-xs leading-5" style={{ color: theme.subtextColor }}>
                  {isValid ? t('certificates.validDescription') : t('certificates.invalidDescription')}
                </p>

                <div className="my-4 border-t" style={{ borderColor: theme.borderColor }} />

                {/* Hash compact */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" style={{ color: theme.actionColor }} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: theme.subtextColor }}
                    >
                      {t('certificates.hashVerified')}
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
                  {validation.certificate.certificateHash}
                </div>
                {hashCopied && (
                  <p className="mt-1.5 text-[11px] text-green-400">{t('certificates.hashCopied')}</p>
                )}

                <div className="my-4 border-t" style={{ borderColor: theme.borderColor }} />

                {/* Chain info compact */}
                <dl className="space-y-2.5 text-xs" style={{ color: theme.subtextColor }}>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.chainIntegrity')}
                    </dt>
                    <dd style={{ color: validation.chainOk ? theme.successColor : theme.dangerColor }}>
                      {validation.chainOk ? t('certificates.chainOk') : t('certificates.chainInconsistent')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.lastOperation')}
                    </dt>
                    <dd>{validation.lastOperation ?? t('certificates.noData')}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold shrink-0" style={{ color: theme.textColor }}>
                      {t('certificates.labelIssuer')}
                    </dt>
                    <dd className="min-w-0 truncate text-right">{validation.certificate.issuerName}</dd>
                  </div>
                </dl>
              </section>
            </aside>

            <section
              className="min-w-0 order-1 xl:order-2 rounded-[28px] border p-5"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="rounded-[24px] border p-4"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              >
                <CertificateDocumentViewport model={validation.certificate.documentModel} />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
