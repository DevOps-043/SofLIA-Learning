'use client'

import type { SmokeMetric } from '../mocks'

export function MetricGrid({ items }: { items: SmokeMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((metric) => (
        <article
          key={metric.id}
          className="rounded-[24px] border border-[var(--color-legacy-dce7f3)] bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-legacy-637489)] dark:text-white/55">
            {metric.label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-primary dark:text-white">
            {metric.value}
          </p>
          <p className="mt-2 text-sm text-[var(--color-legacy-526174)] dark:text-white/60">
            {metric.detail}
          </p>
        </article>
      ))}
    </div>
  )
}
