'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import {
  CheckCircle2,
  Clipboard,
  Download,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface MfaEnrollmentPanelProps {
  backHref: string
}

interface MfaStatusResponse {
  enabled: boolean
  factorId: string | null
  lastUsedAt: string | null
  recoveryCodesRemaining: number
}

interface MfaSetupResponse {
  factorId: string
  recoveryCodes: string[]
  secret: string
  uri: string
}

type FeedbackState = {
  message: string
  type: 'error' | 'success'
} | null

export function MfaEnrollmentPanel({ backHref }: MfaEnrollmentPanelProps) {
  const { t } = useTranslation('common')
  const [status, setStatus] = useState<MfaStatusResponse | null>(null)
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null)
  const [activationToken, setActivationToken] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const recoveryCodesText = useMemo(
    () => setup?.recoveryCodes.join('\n') ?? '',
    [setup?.recoveryCodes],
  )

  useEffect(() => {
    void loadStatus()
  }, [])

  async function loadStatus() {
    setIsLoading(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/auth/mfa/status')
      const payload = await readJson<MfaStatusResponse>(response)
      if (!response.ok || !payload) {
        throw new Error(t('auth.mfa.enrollment.errors.status'))
      }
      setStatus(payload)
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : t('auth.mfa.enrollment.errors.status'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function startSetup() {
    setIsWorking(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/auth/mfa/setup', { method: 'POST' })
      const payload = await readJson<MfaSetupResponse>(response)
      if (!response.ok || !payload) {
        throw new Error(t('auth.mfa.enrollment.errors.setup'))
      }
      setSetup(payload)
      setActivationToken('')
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : t('auth.mfa.enrollment.errors.setup'),
        type: 'error',
      })
    } finally {
      setIsWorking(false)
    }
  }

  async function activateMfa() {
    if (!setup) return

    setIsWorking(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/auth/mfa/activate', {
        body: JSON.stringify({
          factorId: setup.factorId,
          token: activationToken.trim(),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(await readApiError(response, t('auth.mfa.enrollment.errors.activate')))
      }
      setFeedback({
        message: t('auth.mfa.enrollment.activated'),
        type: 'success',
      })
      setSetup(null)
      setActivationToken('')
      await loadStatus()
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : t('auth.mfa.enrollment.errors.activate'),
        type: 'error',
      })
    } finally {
      setIsWorking(false)
    }
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodesText) return
    await navigator.clipboard.writeText(recoveryCodesText)
    setFeedback({
      message: t('auth.mfa.enrollment.recoveryCopied'),
      type: 'success',
    })
  }

  function downloadRecoveryCodes() {
    if (!recoveryCodesText) return
    const blob = new Blob([recoveryCodesText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'soflia-mfa-recovery-codes.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-900 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              {t('auth.mfa.enrollment.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {t('auth.mfa.enrollment.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {t('auth.mfa.enrollment.subtitle')}
            </p>
          </div>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
          >
            {t('auth.mfa.enrollment.backToSettings')}
          </Link>
        </div>

        {feedback ? (
          <div
            className={
              feedback.type === 'success'
                ? 'rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success'
                : 'rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error'
            }
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : status?.enabled ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 text-success" />
                <div>
                  <h2 className="text-xl font-semibold">
                    {t('auth.mfa.enrollment.enabledTitle')}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.mfa.enrollment.enabledDescription', {
                      count: status.recoveryCodesRemaining,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-6 w-6 text-accent" />
                <div>
                  <h2 className="text-xl font-semibold">
                    {t('auth.mfa.enrollment.disabledTitle')}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {t('auth.mfa.enrollment.disabledDescription')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={startSetup}
                disabled={isWorking}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {t('auth.mfa.enrollment.startSetup')}
              </button>
            </div>
          )}
        </section>

        {setup ? (
          <section className="grid gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">
                  {t('auth.mfa.enrollment.scanTitle')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {t('auth.mfa.enrollment.scanDescription')}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t('auth.mfa.enrollment.manualSecret')}
                </p>
                <p className="mt-2 break-all font-mono text-sm">{setup.secret}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold">
                  {t('auth.mfa.enrollment.activationCode')}
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={activationToken}
                      onChange={(event) => setActivationToken(event.target.value)}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                      placeholder={t('auth.mfa.enrollment.activationPlaceholder')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={activateMfa}
                    disabled={isWorking || activationToken.trim().length < 6}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-gray-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {t('auth.mfa.enrollment.activate')}
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm font-semibold text-warning">
                  {t('auth.mfa.enrollment.recoveryTitle')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {setup.recoveryCodes.map((code) => (
                    <code
                      key={code}
                      className="rounded-md bg-white px-3 py-2 text-center font-mono text-sm text-gray-900 dark:bg-gray-900 dark:text-white"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyRecoveryCodes}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-warning/40 px-3 py-2 text-sm font-semibold text-warning"
                  >
                    <Clipboard className="h-4 w-4" />
                    {t('auth.mfa.enrollment.copyRecovery')}
                  </button>
                  <button
                    type="button"
                    onClick={downloadRecoveryCodes}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-warning/40 px-3 py-2 text-sm font-semibold text-warning"
                  >
                    <Download className="h-4 w-4" />
                    {t('auth.mfa.enrollment.downloadRecovery')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-center">
              <div className="rounded-xl bg-white p-4">
                <QRCode value={setup.uri} size={188} />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  const payload = await readJson<{ error?: string; message?: string }>(response)
  return payload?.message ?? payload?.error ?? fallback
}
