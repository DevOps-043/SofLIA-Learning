'use client'

import { type ReactNode } from 'react'

interface SurfaceProps {
  title: string
  subtitle?: string
  children: ReactNode
  testId?: string
}

export function Surface({ title, subtitle, children, testId }: SurfaceProps) {
  return (
    <section
      data-testid={testId}
      className="rounded-[28px] border border-[#DCE7F3] bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#0C1628]"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#637489] dark:text-white/60">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}
