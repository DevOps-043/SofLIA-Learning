'use client'

import { motion } from 'framer-motion'
import {
  AcademicCapIcon,
  ChartBarIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { colors } from '../shared'
import type { StatsOverview } from './types'

const ITEMS = [
  {
    key: 'totalUsers' as const,
    label: 'Total de Usuarios',
    color: colors.primary,
    icon: UserGroupIcon,
    suffix: '',
  },
  {
    key: 'engagementRate' as const,
    label: 'Compromiso Semanal',
    color: colors.success,
    icon: ChartBarIcon,
    suffix: '%',
  },
  {
    key: 'assignedCourses' as const,
    label: 'Cursos Adquiridos',
    color: colors.accent,
    icon: AcademicCapIcon,
    suffix: '',
  },
  {
    key: 'avgSatisfaction' as const,
    label: 'Satisfacción (LIA NPS)',
    color: colors.purple,
    icon: StarIcon,
    suffix: '',
  },
] as const

export function StatsSummaryCards({ overview }: { overview: StatsOverview }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {ITEMS.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-carbon-800"
          >
            {/* Icon pill */}
            <div
              className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)` }}
            >
              <Icon className="h-5 w-5" style={{ color: item.color }} />
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black leading-none" style={{ color: item.color }}>
                {overview[item.key]}{item.suffix}
              </p>
              {item.key === 'avgSatisfaction' && (
                <span className="text-sm font-bold text-gray-400 dark:text-white/30">/ 5</span>
              )}
            </div>

            {/* Label */}
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-white/40">
              {item.label}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
