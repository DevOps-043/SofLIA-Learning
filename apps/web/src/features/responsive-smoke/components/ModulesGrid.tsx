'use client'

import type { SmokeModule } from '../mocks'

interface ModulesGridProps {
  modules: SmokeModule[]
  accent?: 'admin' | 'instructor'
}

export function ModulesGrid({ modules, accent = 'admin' }: ModulesGridProps) {
  const actionTone =
    accent === 'admin'
      ? 'bg-primary text-white'
      : 'bg-accent text-[var(--color-legacy-06231e)]'

  return (
    <div className="space-y-4" data-testid="responsive-smoke-module-list">
      {modules.map((module) => (
        <article
          key={module.id}
          className="rounded-[26px] border border-[var(--color-legacy-dce7f3)] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-accent/[0.12] px-3 py-1 text-xs font-semibold text-[var(--color-legacy-0a7f6d)]">
                  {module.status}
                </span>
                <span className="inline-flex rounded-full bg-[var(--color-legacy-eef4fb)] px-3 py-1 text-xs font-medium text-[var(--color-legacy-526174)] dark:bg-white/10 dark:text-white/60">
                  {module.duration}
                </span>
                <span className="inline-flex rounded-full bg-[var(--color-legacy-eef4fb)] px-3 py-1 text-xs font-medium text-[var(--color-legacy-526174)] dark:bg-white/10 dark:text-white/60">
                  {module.lessons} lecciones
                </span>
              </div>
              <h3 className="max-w-3xl text-xl font-semibold leading-tight text-primary dark:text-white">
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
                className="rounded-2xl border border-[var(--color-legacy-dce7f3)] bg-slate-50 px-4 py-3 text-sm font-semibold text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
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
