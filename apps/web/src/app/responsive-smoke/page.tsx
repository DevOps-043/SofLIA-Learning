import Link from 'next/link'

import {
  responsiveSmokeScenarioIds,
  responsiveSmokeScenarioLabels,
} from '@/features/responsive-smoke/constants'

export default function ResponsiveSmokeIndexPage() {
  return (
    <main className="min-h-screen bg-[var(--color-legacy-f4f8fc)] px-4 py-10 dark:bg-[var(--color-legacy-050b14)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[var(--color-legacy-dce7f3)] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[var(--color-legacy-09111f)] sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-legacy-637489)] dark:text-white/55">
            Responsive Smoke
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary dark:text-white">
            Escenarios de validacion manual
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-legacy-526174)] dark:text-white/65">
            Harness interno para revisar layouts responsive y ejecutar la suite
            Playwright sin depender de autenticacion real.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {responsiveSmokeScenarioIds.map((scenario) => (
            <Link
              key={scenario}
              href={`/responsive-smoke/${scenario}`}
              className="rounded-[24px] border border-[var(--color-legacy-dce7f3)] bg-slate-50 px-5 py-4 text-sm font-semibold text-primary transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {responsiveSmokeScenarioLabels[scenario]}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
