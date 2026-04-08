import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { HumanVerificationChallenge } from '@/components/security/HumanVerificationChallenge'
import {
  sanitizeReturnTo,
  VERIFICATION_CHALLENGE_COOKIE_NAME,
} from '@/lib/security/security-state'
import { verifyToken } from '@/lib/security/signed-token'
import type { VerificationChallengeCookie } from '@/lib/security/security-state'

export const metadata: Metadata = {
  title: 'Verificación de Seguridad | SofLIA',
  description: 'Verificación de seguridad para continuar navegando en SofLIA.',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

interface VerificationPageProps {
  searchParams?: {
    returnTo?: string | string[]
  }
}

export default function VerificationPage(props: VerificationPageProps) {
  const cookieStore = cookies()
  const challenge = verifyToken<VerificationChallengeCookie>(
    cookieStore.get(VERIFICATION_CHALLENGE_COOKIE_NAME)?.value,
  )
  const returnTo = sanitizeReturnTo(
    Array.isArray(props.searchParams?.returnTo)
      ? props.searchParams?.returnTo[0]
      : props.searchParams?.returnTo,
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_38%),_linear-gradient(180deg,_#07111b_0%,_#0b1220_42%,_#050912_100%)] text-white">
      {challenge ? (
        <HumanVerificationChallenge
          minHoldMs={challenge.minHoldMs}
          defaultReturnTo={challenge.returnTo || returnTo}
        />
      ) : (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-full rounded-[28px] border border-white/10 bg-[#0f1728]/90 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur">
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              El reto expiró
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
              Necesitamos generar un nuevo reto de seguridad para continuar.
            </p>
            <Link
              href={returnTo}
              className="mt-8 inline-flex rounded-2xl border border-[#34d399]/30 bg-[#0f766e]/20 px-6 py-4 text-base font-semibold text-[#34d399] transition hover:border-[#34d399]/50 hover:bg-[#0f766e]/30"
            >
              Reintentar navegación
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
