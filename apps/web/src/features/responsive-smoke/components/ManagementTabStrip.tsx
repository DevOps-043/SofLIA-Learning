'use client'

const managementTabs = [
  'Modulos',
  'Configuracion',
  'Vista previa',
  'Estadisticas',
] as const

export function ManagementTabStrip() {
  return (
    <div
      data-testid="responsive-smoke-tabs"
      className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1"
    >
      {managementTabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          className={`min-w-[148px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            index === 0
              ? 'bg-primary text-white'
              : 'border border-[var(--color-legacy-dce7f3)] bg-white text-[var(--color-legacy-526174)] dark:border-white/10 dark:bg-white/5 dark:text-white/70'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
