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
              ? 'bg-[#0A2540] text-white'
              : 'border border-[#DCE7F3] bg-white text-[#526174] dark:border-white/10 dark:bg-white/5 dark:text-white/70'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
