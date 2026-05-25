'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { Copy, Download, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

interface ApiErrorPayload {
  error?: string
  message?: string
}

export function MfaSettingsPanel() {
  const { t } = useTranslation('common')
  const [status, setStatus] = useState<MfaStatusResponse | null>(null)
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/mfa/status', {
        credentials: 'include',
      })
      const payload = await readJson<MfaStatusResponse | ApiErrorPayload>(response)
      if (!response.ok || !isMfaStatus(payload)) {
        throw new Error(readApiError(payload) ?? 'status_failed')
      }
      setStatus(payload)
    } catch {
      setError(t('auth.mfa.settings.errors.status'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  async function startSetup() {
    setWorking(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        credentials: 'include',
        method: 'POST',
      })
      const payload = await readJson<MfaSetupResponse | ApiErrorPayload>(response)
      if (!response.ok || !isMfaSetup(payload)) {
        throw new Error(readApiError(payload) ?? 'setup_failed')
      }
      setSetup(payload)
      setToken('')
    } catch {
      setError(t('auth.mfa.settings.errors.setup'))
    } finally {
      setWorking(false)
    }
  }

  async function activateSetup() {
    if (!setup) return

    setWorking(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/auth/mfa/activate', {
        body: JSON.stringify({
          factorId: setup.factorId,
          token: token.trim(),
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const payload = await readJson<{ activated?: boolean } | ApiErrorPayload>(response)
      if (!response.ok || !isActivated(payload)) {
        throw new Error(readApiError(payload) ?? 'activate_failed')
      }
      setSetup(null)
      setToken('')
      setNotice(t('auth.mfa.settings.enabledNotice'))
      await loadStatus()
    } catch {
      setError(t('auth.mfa.settings.errors.activate'))
    } finally {
      setWorking(false)
    }
  }

  async function copyRecoveryCodes() {
    if (!setup?.recoveryCodes.length) return
    await navigator.clipboard.writeText(setup.recoveryCodes.join('\n'))
    setNotice(t('auth.mfa.settings.recoveryCopied'))
  }

  function downloadRecoveryCodes() {
    if (!setup?.recoveryCodes.length) return
    const blob = new Blob([setup.recoveryCodes.join('\n')], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'soflia-mfa-recovery-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('auth.mfa.settings.title')}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-white/60">
              {t('auth.mfa.settings.description')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading || working}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('actions.refresh')}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('actions.loading')}
        </div>
      ) : null}

      {!loading && status ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusItem label={t('auth.mfa.settings.status')} value={status.enabled ? t('auth.mfa.settings.enabled') : t('auth.mfa.settings.disabled')} />
          <StatusItem label={t('auth.mfa.settings.recoveryRemaining')} value={String(status.recoveryCodesRemaining)} />
          <StatusItem label={t('auth.mfa.settings.lastUsed')} value={status.lastUsedAt ? formatDate(status.lastUsedAt) : t('auth.mfa.settings.neverUsed')} />
        </div>
      ) : null}

      {!status?.enabled && !setup ? (
        <button
          type="button"
          onClick={() => void startSetup()}
          disabled={working || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {t('auth.mfa.settings.startSetup')}
        </button>
      ) : null}

      {setup ? (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10">
            <QRCode value={setup.uri} size={180} />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('auth.mfa.settings.manualSecret')}
              </p>
              <p className="mt-1 break-all rounded-lg bg-gray-100 p-3 font-mono text-sm text-gray-800 dark:bg-white/10 dark:text-white/80">
                {setup.secret}
              </p>
            </div>

            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('auth.mfa.settings.recoveryCodes')}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void copyRecoveryCodes()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10">
                    <Copy className="h-3.5 w-3.5" />
                    {t('actions.copy')}
                  </button>
                  <button type="button" onClick={downloadRecoveryCodes} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10">
                    <Download className="h-3.5 w-3.5" />
                    {t('actions.download')}
                  </button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {setup.recoveryCodes.map((code) => (
                  <code key={code} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 dark:bg-white/10 dark:text-white/80">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="mfa-activation-token" className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('auth.mfa.settings.activationCode')}
              </label>
              <input
                id="mfa-activation-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-white/10"
              />
            </div>

            <button
              type="button"
              onClick={() => void activateSetup()}
              disabled={working || token.trim().length < 6}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t('auth.mfa.settings.activate')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StatusItem(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase text-gray-500 dark:text-white/45">
        {props.label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {props.value}
      </p>
    </div>
  )
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T
  } catch {
    return null
  }
}

function isMfaStatus(value: unknown): value is MfaStatusResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<MfaStatusResponse>
  return (
    typeof candidate.enabled === 'boolean' &&
    (typeof candidate.factorId === 'string' || candidate.factorId === null) &&
    (typeof candidate.lastUsedAt === 'string' || candidate.lastUsedAt === null) &&
    typeof candidate.recoveryCodesRemaining === 'number'
  )
}

function isMfaSetup(value: unknown): value is MfaSetupResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<MfaSetupResponse>
  return (
    typeof candidate.factorId === 'string' &&
    Array.isArray(candidate.recoveryCodes) &&
    candidate.recoveryCodes.every((code) => typeof code === 'string') &&
    typeof candidate.secret === 'string' &&
    typeof candidate.uri === 'string'
  )
}

function isActivated(value: unknown): value is { activated: true } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'activated' in value &&
    value.activated === true,
  )
}

function readApiError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as ApiErrorPayload
  return candidate.message ?? candidate.error ?? null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
