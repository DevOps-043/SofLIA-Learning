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
import { CertificateDocumentPreview } from '@/features/certificates/components/CertificateDocumentPreview'
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
      className="min-h-screen"
      style={{
        backgroundColor: theme.panelBg,
        color: theme.textColor,
      }}
    >
      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-10">
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
          {t('certificates.myCertificates')}
        </button>

        <header
          className="rounded-[28px] border p-6 md:p-8"
          style={{
            background: theme.heroBackground,
            borderColor: theme.heroBorderColor,
            color: theme.inverseTextColor,
          }}
        >
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                backgroundColor: theme.inverseSurface,
                borderColor: theme.inverseBorderColor,
                color: theme.inverseSubtextColor,
              }}
            >
              <Shield className="h-3.5 w-3.5" />
              {t('certificates.verifyBadge')}
            </div>
            <h1 className="mt-4 text-3xl font-black md:text-5xl">
              {t('certificates.verifyTitle')}
            </h1>
            <p className="mt-3 text-sm md:text-base" style={{ color: theme.inverseSubtextColor }}>
              {t('certificates.verifySubtitle')}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin" style={{ color: theme.actionColor }} />
              <p style={{ color: theme.subtextColor }}>{t('certificates.loadingValidation')}</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="mt-8 rounded-[28px] border p-8 text-center"
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
          <div className="mt-8 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section
                className="rounded-[28px] border p-6"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
              >
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]"
                  style={{
                    backgroundColor: isValid ? `${theme.successColor}18` : `${theme.dangerColor}18`,
                    color: isValid ? theme.successColor : theme.dangerColor,
                  }}
                >
                  {isValid ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  {isValid ? t('certificates.statusValid') : validation.expired ? t('certificates.statusExpired') : t('certificates.statusInvalid')}
                </div>

                <h2 className="mt-4 text-3xl font-black leading-tight" style={{ color: theme.textColor }}>
                  {validation.certificate.courseTitle}
                </h2>

                <p className="mt-3 text-sm leading-6" style={{ color: theme.subtextColor }}>
                  {isValid ? t('certificates.validDescription') : t('certificates.invalidDescription')}
                </p>
              </section>

              <section
                className="rounded-[28px] border p-6"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" style={{ color: theme.actionColor }} />
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: theme.subtextColor }}>
                      {t('certificates.hashVerified')}
                    </h3>
                  </div>
                  <button
                    onClick={copyHash}
                    className="rounded-xl border p-2"
                    style={{
                      borderColor: theme.borderColor,
                      backgroundColor: theme.inputBg,
                      color: theme.textColor,
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div
                  className="rounded-2xl border px-4 py-3 font-mono text-xs leading-6"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                    wordBreak: 'break-all',
                  }}
                >
                  {validation.certificate.certificateHash}
                </div>

                {hashCopied && (
                  <p className="mt-1 text-xs text-green-400">{t('certificates.hashCopied')}</p>
                )}

                <dl className="mt-4 space-y-3 text-sm" style={{ color: theme.subtextColor }}>
                  <div>
                    <dt className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.chainIntegrity')}
                    </dt>
                    <dd>{validation.chainOk ? t('certificates.chainOk') : t('certificates.chainInconsistent')}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.lastOperation')}
                    </dt>
                    <dd>{validation.lastOperation ?? t('certificates.noData')}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold" style={{ color: theme.textColor }}>
                      {t('certificates.labelIssuer')}
                    </dt>
                    <dd>{validation.certificate.issuerName}</dd>
                  </div>
                </dl>
              </section>
            </aside>

            <section
              className="rounded-[28px] border p-6"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.subtextColor,
                }}
              >
                {t('certificates.docPreviewLabel')}
              </div>

              <div
                className="mt-5 overflow-x-auto rounded-[24px] border p-4"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              >
                <CertificateDocumentPreview model={validation.certificate.documentModel} scale={0.58} />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
