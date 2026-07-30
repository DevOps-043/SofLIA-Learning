'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  Fingerprint,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { CertificateDocumentViewport } from '@/features/certificates/components/CertificateDocumentViewport'
import styles from '@/features/certificates/components/CertificateExperience.module.css'
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
    if (!hash || hash === '[hash]') {
      setLoading(false)
      setError(t('certificates.invalidHash'))
      return
    }

    void validateCertificate(hash)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])

  async function validateCertificate(certificateHash: string): Promise<void> {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/certificates/verify/${certificateHash}`)
      const data = (await response.json().catch(() => ({}))) as
        Partial<CertificateVerificationResult> & { error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? t('certificates.errorValidate'))
      }

      setValidation(data as CertificateVerificationResult)
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : t('certificates.errorUnknown'),
      )
    } finally {
      setLoading(false)
    }
  }

  function copyHash(): void {
    if (!validation) return

    void navigator.clipboard.writeText(validation.certificate.certificateHash)
    setHashCopied(true)
    setTimeout(() => setHashCopied(false), 3000)
  }

  const isValid = Boolean(validation?.valid && !validation.expired && validation.chainOk)

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
            {t('certificates.myCertificates')}
          </button>
          <span className={styles.toolbarLabel}>
            <span className={styles.toolbarDot} aria-hidden="true" />
            Validación pública protegida
          </span>
        </div>

        {loading ? (
          <div className={styles.stateCard} role="status">
            <span className={styles.stateIcon}>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </span>
            <h1 className={styles.stateTitle}>{t('certificates.loadingValidation')}</h1>
            <p className={styles.stateText}>
              Estamos comprobando la integridad de esta credencial.
            </p>
          </div>
        ) : error ? (
          <div className={styles.stateCard} role="alert">
            <span className={`${styles.stateIcon} ${styles.stateIconError}`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className={styles.stateTitle}>{t('certificates.validateErrorTitle')}</h1>
            <p className={styles.stateText}>{error}</p>
            <button
              type="button"
              onClick={() => void validateCertificate(hash)}
              className={styles.primaryButton}
            >
              {t('certificates.retry')}
            </button>
          </div>
        ) : validation ? (
          <div className={styles.verifyGrid}>
            <aside className={styles.detailsCard}>
              <header className={styles.detailsHeader}>
                <span
                  className={`${styles.statusBadge} ${
                    isValid ? styles.statusValid : styles.statusInvalid
                  }`}
                >
                  {isValid ? (
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                  )}
                  {isValid
                    ? t('certificates.statusValid')
                    : validation.expired
                      ? t('certificates.statusExpired')
                      : t('certificates.statusInvalid')}
                </span>
                <h1 className={styles.detailsTitle}>
                  {validation.certificate.courseTitle}
                </h1>
                <p className={styles.detailsDescription}>
                  {isValid
                    ? t('certificates.validDescription')
                    : t('certificates.invalidDescription')}
                </p>
              </header>

              <div className={styles.detailsBody}>
                <div className={styles.hashHeader}>
                  <span className={styles.hashLabel}>
                    <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('certificates.hashVerified')}
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
                <div
                  className={styles.hashValue}
                  title={validation.certificate.certificateHash}
                >
                  {validation.certificate.certificateHash}
                </div>
                {hashCopied && (
                  <p className={styles.copied}>{t('certificates.hashCopied')}</p>
                )}

                <div className={styles.divider} />

                <dl className={styles.chainList}>
                  <div className={styles.chainRow}>
                    <dt className={styles.chainTerm}>
                      {t('certificates.chainIntegrity')}
                    </dt>
                    <dd
                      className={`${styles.chainValue} ${
                        validation.chainOk
                          ? styles.chainValueSuccess
                          : styles.chainValueError
                      }`}
                    >
                      {validation.chainOk
                        ? t('certificates.chainOk')
                        : t('certificates.chainInconsistent')}
                    </dd>
                  </div>
                  <div className={styles.chainRow}>
                    <dt className={styles.chainTerm}>
                      {t('certificates.lastOperation')}
                    </dt>
                    <dd className={styles.chainValue}>
                      {validation.lastOperation ?? t('certificates.noData')}
                    </dd>
                  </div>
                  <div className={styles.chainRow}>
                    <dt className={styles.chainTerm}>
                      {t('certificates.labelIssuer')}
                    </dt>
                    <dd
                      className={styles.chainValue}
                      title={validation.certificate.issuerName}
                    >
                      {validation.certificate.issuerName}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>

            <section className={styles.documentPanel} aria-label="Certificado verificado">
              <header className={styles.documentPanelHeader}>
                <span className={styles.documentLabel}>
                  <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Documento contrastado
                </span>
                <span
                  className={styles.documentState}
                  style={{ color: isValid ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {isValid ? (
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isValid ? 'Integridad confirmada' : 'Revisión requerida'}
                </span>
              </header>
              <div className={styles.documentShell}>
                <CertificateDocumentViewport
                  model={validation.certificate.documentModel}
                />
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
