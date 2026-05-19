'use client'

import { Plus, Sparkles } from 'lucide-react'

import { ResponsiveDataTable } from '@/core/layout'

import { ActionButton } from '../components/ActionButton'
import { MetricGrid } from '../components/MetricGrid'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import {
  smokeMetrics,
  smokeWorkshopColumns,
  smokeWorkshopRows,
} from '../mocks'

export function AdminDashboardScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Admin Dashboard"
      description="Shell administrativo con metricas, acciones que envuelven correctamente y una tabla que cambia entre desktop y mobile sin provocar overflow horizontal."
      actions={
        <>
          <ActionButton icon={<Sparkles className="h-4 w-4" />} label="Recalcular reportes" />
          <ActionButton icon={<Plus className="h-4 w-4" />} label="Crear taller" emphasis="primary" />
        </>
      }
    >
      <MetricGrid items={smokeMetrics} />
      <Surface
        title="Talleres recientes"
        subtitle="Validacion de tabla responsive con celdas de texto largo."
        testId="responsive-smoke-table-surface"
      >
        <ResponsiveDataTable
          data={smokeWorkshopRows}
          columns={smokeWorkshopColumns}
          keyExtractor={(item) => item.id}
          tableMinWidthClassName="min-w-[780px]"
          tableWrapperClassName="rounded-2xl border border-[var(--color-legacy-e3ecf5)]"
        />
      </Surface>
    </ScenarioCanvas>
  )
}
