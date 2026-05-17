'use client'

import { Plus, Settings2 } from 'lucide-react'

import { ResponsiveDataTable } from '@/core/layout'

import { ActionButton } from '../components/ActionButton'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeWorkshopColumns, smokeWorkshopRows } from '../mocks'

export function AdminWorkshopsScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Admin Workshops"
      description="Listado de talleres con filtros, tarjetas densas y tabla de control para validar wrapping, truncado y cambios de layout por breakpoint."
      actions={
        <>
          <ActionButton icon={<Settings2 className="h-4 w-4" />} label="Filtrar estados" />
          <ActionButton icon={<Plus className="h-4 w-4" />} label="Nuevo taller" emphasis="primary" />
        </>
      }
    >
      <Surface title="Embudo de publicacion" subtitle="Tarjetas con contenido variable que no deben romper el grid.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {smokeWorkshopRows.map((workshop) => (
            <article key={workshop.id} className="rounded-[24px] border border-[#DCE7F3] bg-[#F8FAFC] p-5 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#00D4B3]/12 px-3 py-1 text-xs font-semibold text-[#0A7F6D]">{workshop.status}</span>
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[#526174] dark:bg-[#09111F] dark:text-white/60">{workshop.learners} alumnos</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-tight text-[#0A2540] dark:text-white">{workshop.title}</h3>
              <p className="mt-3 text-sm text-[#637489] dark:text-white/60">Responsable: {workshop.owner}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white">Gestionar curso</button>
                <button type="button" className="rounded-2xl border border-[#DCE7F3] bg-white px-4 py-3 text-sm font-semibold text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white">Ver detalles</button>
              </div>
            </article>
          ))}
        </div>
      </Surface>
      <Surface title="Control rapido" subtitle="Fallback tabular para tablet y desktop.">
        <ResponsiveDataTable data={smokeWorkshopRows} columns={smokeWorkshopColumns} keyExtractor={(item) => item.id} tableMinWidthClassName="min-w-[780px]" />
      </Surface>
    </ScenarioCanvas>
  )
}
