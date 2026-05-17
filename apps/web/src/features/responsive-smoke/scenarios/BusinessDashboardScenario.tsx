'use client'

import { BarChart3, Sparkles } from 'lucide-react'

import { ResponsiveDataTable } from '@/core/layout'

import { ActionButton } from '../components/ActionButton'
import { MetricGrid } from '../components/MetricGrid'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeMetrics, smokeReportColumns, smokeReportRows } from '../mocks'
import { businessDashboardTasks } from './scenario-data'

export function BusinessDashboardScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Business Dashboard"
      description="Dashboard de negocio con metricas, paneles laterales y tabla de seguimiento. Se valida que tarjetas, listas y tabla convivan sin generar overflow en laptop o tablet."
      actions={
        <>
          <ActionButton icon={<BarChart3 className="h-4 w-4" />} label="Exportar metricas" />
          <ActionButton icon={<Sparkles className="h-4 w-4" />} label="Actualizar panel" emphasis="primary" />
        </>
      }
    >
      <MetricGrid items={smokeMetrics} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Surface title="Resumen ejecutivo" subtitle="La tabla cambia a cards en mobile y conserva contexto." testId="business-dashboard-report-surface">
          <ResponsiveDataTable data={smokeReportRows} columns={smokeReportColumns} keyExtractor={(item) => item.id} tableMinWidthClassName="min-w-[760px]" />
        </Surface>
        <Surface title="Acciones prioritarias" subtitle="Stack lateral que debe caer debajo en viewports estrechos.">
          <div className="space-y-3">
            {businessDashboardTasks.map((task) => (
              <div key={task} className="rounded-[22px] border border-[#DCE7F3] bg-[#F8FAFC] p-4 text-sm text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white">
                {task}
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </ScenarioCanvas>
  )
}
