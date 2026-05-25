'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import type { StatsOverview } from './types'

const IMPACT_ITEMS = [
  { key: 'totalEnrolled', label: 'Total Alumnos', color: 'text-blue-500' },
  { key: 'totalGraduated', label: 'Graduados', color: 'text-green-500' },
  { key: 'activeInLast30Days', label: 'Activos (30d)', color: 'text-purple-500' },
  { key: 'averageCourseProgress', label: 'Progreso Prom.', color: 'text-orange-500', suffix: '%' },
] as const

export function StatsImpactCard({ overview }: { overview: StatsOverview }) {
  const healthLabel =
    overview.engagementRate > 60 ? 'Excepcional' : overview.engagementRate > 30 ? 'Saludable' : 'En riesgo'

  return (
    <Card title="Impacto del Aprendizaje" description="Métricas de calidad y constancia" icon={SparklesIcon} iconColor={colors.warning}>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {IMPACT_ITEMS.map((item) => (
          <div key={item.key} className="flex flex-col justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center dark:border-white/5 dark:bg-carbon-900">
            <p className={`text-2xl font-black ${item.color}`}>{overview[item.key]}{item.suffix || ''}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-white/40">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid h-full grid-cols-2 gap-4">
        <StatsImpactMetric value={overview.totalSessions} label="Lecciones Completas" color={colors.blue} />
        <StatsImpactMetric value={`${Math.round(overview.totalLearningHours / 24)}d`} label="Tiempo Acumulado" color={colors.warning} />
        <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/60">Salud del Ecosistema</p>
              <p className="mt-1 text-xs font-bold">Nivel de compromiso: <span style={{ color: overview.engagementRate > 30 ? colors.success : colors.warning }}>{healthLabel}</span></p>
            </div>
            <SparklesIcon className="h-8 w-8 opacity-20" />
          </div>
        </div>
      </div>
    </Card>
  )
}

function StatsImpactMetric({
  value,
  label,
  color,
}: {
  value: number | string
  label: string
  color: string
}) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{label}</p>
    </div>
  )
}
