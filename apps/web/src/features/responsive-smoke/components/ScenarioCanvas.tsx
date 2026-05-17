'use client'

import { type ReactNode } from 'react'

import { PageShell } from '@/core/layout'

interface ScenarioCanvasProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

export function ScenarioCanvas({
  eyebrow,
  title,
  description,
  actions,
  children,
}: ScenarioCanvasProps) {
  return (
    <main
      data-testid="responsive-smoke-root"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,212,179,0.12),_transparent_38%),linear-gradient(180deg,_#F8FAFC_0%,_#EEF4FB_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(0,212,179,0.12),_transparent_35%),linear-gradient(180deg,_#050B14_0%,_#0B1220_100%)]"
    >
      <PageShell size="wide" spacing="relaxed">
        <section className="rounded-[32px] border border-[#DCE7F3] bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-[#09111F]/85">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <span className="inline-flex w-fit items-center rounded-full bg-[#0A2540]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0A2540] dark:bg-white/10 dark:text-white/70">
                {eyebrow}
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-[#0A2540] sm:text-4xl dark:text-white">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#526174] sm:text-base dark:text-white/65">
                  {description}
                </p>
              </div>
            </div>
            {actions ? (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
                {actions}
              </div>
            ) : null}
          </div>
        </section>
        <div className="mt-6 space-y-6">{children}</div>
      </PageShell>
    </main>
  )
}
