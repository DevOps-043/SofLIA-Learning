'use client'

import type { SmokeMetric } from '../mocks'

export function MetricGrid({ items }: { items: SmokeMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((metric) => (
        <article
          key={metric.id}
          className="rounded-[24px] border border-[#DCE7F3] bg-[#F8FAFC] p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#637489] dark:text-white/55">
            {metric.label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-[#0A2540] dark:text-white">
            {metric.value}
          </p>
          <p className="mt-2 text-sm text-[#526174] dark:text-white/60">
            {metric.detail}
          </p>
        </article>
      ))}
    </div>
  )
}
