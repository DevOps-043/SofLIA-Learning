'use client'

import {
  BookOpenIcon,
  ClockIcon,
  PlayIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import type { WorkshopStats } from '../../services/adminWorkshops.service'
import { AdminMetricCard } from '../ui'

interface AdminWorkshopsStatsGridProps {
  stats: WorkshopStats | null
}

export function AdminWorkshopsStatsGrid({
  stats,
}: AdminWorkshopsStatsGridProps) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard
        label="Total talleres"
        value={stats?.totalWorkshops || 0}
        icon={BookOpenIcon}
        tone="primary"
      />
      <AdminMetricCard
        label="Activos"
        value={stats?.activeWorkshops || 0}
        icon={PlayIcon}
        tone="success"
      />
      <AdminMetricCard
        label="Total estudiantes"
        value={stats?.totalStudents || 0}
        icon={UserCircleIcon}
        tone="accent"
      />
      <AdminMetricCard
        label="Duracion promedio"
        value={`${stats?.averageDuration || 0} min`}
        icon={ClockIcon}
        tone="warning"
      />
    </section>
  )
}
