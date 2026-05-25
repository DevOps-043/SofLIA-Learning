'use client'

import { LayoutDashboard } from 'lucide-react'

import { ResponsiveDataTable } from '@/core/layout'

import { ActionButton } from '../components/ActionButton'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeReportColumns, smokeReportRows } from '../mocks'

export function BusinessUnifiedPanelScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Business Unified Panel"
      description="Caso aislado de tabla responsive con metadata mobile. Se valida desktop table, card mode en mobile y ausencia de overflow lateral."
      actions={<ActionButton icon={<LayoutDashboard className="h-4 w-4" />} label="Vista consolidada" />}
    >
      <Surface title="Vista operativa por area" subtitle="Las etiquetas mobile se leen sin depender del header render context." testId="business-unified-surface">
        <ResponsiveDataTable data={smokeReportRows} columns={smokeReportColumns} keyExtractor={(item) => item.id} tableMinWidthClassName="min-w-[760px]" />
      </Surface>
    </ScenarioCanvas>
  )
}
