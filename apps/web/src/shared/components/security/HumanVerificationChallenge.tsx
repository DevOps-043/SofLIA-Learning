'use client'

import { useMemo, useRef, useState } from 'react'

interface HumanVerificationChallengeProps {
  minHoldMs: number
  defaultReturnTo: string
}

export function HumanVerificationChallenge(
  props: HumanVerificationChallengeProps,
) {
  const { minHoldMs, defaultReturnTo } = props
  const [pressing, setPressing] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const holdSeconds = useMemo(
    () => (minHoldMs / 1000).toFixed(1),
    [minHoldMs],
  )

  async function submitVerification(holdDurationMs: number) {
    setVerifying(true)
    setError(null)

    try {
      const response = await fetch('/api/security/verify-human', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          holdDurationMs,
          returnTo: defaultReturnTo,
        }),
      })

      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
        redirectTo?: string
      }

      if (!response.ok || !payload.ok || !payload.redirectTo) {
        setError(
          payload.error ||
            'No se pudo completar la verificacion. Intenta nuevamente.',
        )
        return
      }

      window.location.assign(payload.redirectTo)
    } catch {
      setError('No se pudo completar la verificacion. Intenta nuevamente.')
    } finally {
      setVerifying(false)
    }
  }

  function beginPress() {
    if (verifying) {
      return
    }

    startTimeRef.current = Date.now()
    setPressing(true)
    setError(null)
  }

  function endPress() {
    if (verifying) {
      return
    }

    const startedAt = startTimeRef.current
    startTimeRef.current = null
    setPressing(false)

    if (!startedAt) {
      return
    }

    const holdDurationMs = Date.now() - startedAt

    if (holdDurationMs < minHoldMs) {
      setError(
        `Debes mantener presionado al menos ${holdSeconds} segundos para continuar.`,
      )
      return
    }

    void submitVerification(holdDurationMs)
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-full rounded-[28px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur">
        <span className="inline-flex rounded-full border border-success/30 bg-success/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-success">
          Proteccion activa
        </span>
        <h1 className="mt-6 text-3xl font-bold text-white md:text-4xl">
          Verificacion requerida
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
          Detectamos señales de automatizacion inusual. Para continuar, mantén
          presionado el botón durante {holdSeconds} segundos.
        </p>

        <button
          type="button"
          onPointerDown={beginPress}
          onPointerUp={endPress}
          onPointerLeave={pressing ? endPress : undefined}
          onPointerCancel={pressing ? endPress : undefined}
          disabled={verifying}
          className={`mt-8 w-full rounded-2xl border px-6 py-5 text-lg font-semibold transition ${
            pressing
              ? 'border-success bg-teal-700 text-white shadow-[0_0_0_6px_rgba(52,211,153,0.14)]'
              : 'border-white/15 bg-gray-900 text-white hover:border-success/50 hover:bg-slate-800'
          } ${verifying ? 'cursor-wait opacity-80' : ''}`}
        >
          {verifying
            ? 'Verificando...'
            : pressing
              ? 'Sigue presionando...'
              : 'Mantener presionado para continuar'}
        </button>

        <p className="mt-4 text-sm text-slate-400">
          Esto ayuda a diferenciar navegacion legitima de scraping o clonacion
          automatizada.
        </p>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
