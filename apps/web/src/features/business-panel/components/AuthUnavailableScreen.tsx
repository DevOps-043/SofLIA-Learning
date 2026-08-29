'use client'

import { RefreshCw, ShieldAlert } from 'lucide-react'

interface AuthUnavailableScreenProps {
  onRetry: () => void
}

export function AuthUnavailableScreen({ onRetry }: AuthUnavailableScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl"
        role="alert"
      >
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <ShieldAlert aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-semibold">No pudimos validar tu sesión</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          El servicio de autenticación no está disponible temporalmente. Tu sesión no se cerró.
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Reintentar
        </button>
      </section>
    </main>
  )
}
