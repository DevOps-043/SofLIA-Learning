'use client'

import type { SmokeModule } from '../mocks'

interface ModulesGridProps {
  modules: SmokeModule[]
  accent?: 'admin' | 'instructor'
}

export function ModulesGrid({ modules, accent = 'admin' }: ModulesGridProps) {
  const actionTone =
    accent === 'admin'
      ? 'bg-[#0A2540] text-white'
      : 'bg-[#00D4B3] text-[#06231E]'

  return (
    <div className="space-y-4" data-testid="responsive-smoke-module-list">
      {modules.map((module) => (
        <article
          key={module.id}
          className="rounded-[26px] border border-[#DCE7F3] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#00D4B3]/12 px-3 py-1 text-xs font-semibold text-[#0A7F6D]">
                  {module.status}
                </span>
                <span className="inline-flex rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-medium text-[#526174] dark:bg-white/10 dark:text-white/60">
                  {module.duration}
                </span>
                <span className="inline-flex rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-medium text-[#526174] dark:bg-white/10 dark:text-white/60">
                  {module.lessons} lecciones
                </span>
              </div>
              <h3 className="max-w-3xl text-xl font-semibold leading-tight text-[#0A2540] dark:text-white">
                {module.title}
              </h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <button
                type="button"
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${actionTone}`}
              >
                Agregar leccion
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[#DCE7F3] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                Editar modulo
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
