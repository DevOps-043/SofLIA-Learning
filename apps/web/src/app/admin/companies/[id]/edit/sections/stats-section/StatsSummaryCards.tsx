'use client'

import { motion } from 'framer-motion'
import type { StatsOverview } from './types'

const ITEMS = [
  { key: 'totalUsers', label: 'Usuarios Totales', color: 'text-black dark:text-white', suffix: '' },
  { key: 'engagementRate', label: 'Compromiso Semanal', color: 'text-green-500', suffix: '%' },
  { key: 'assignedCourses', label: 'Cursos Adquiridos', color: 'text-accent', suffix: '' },
  { key: 'avgSatisfaction', label: 'Satisfacción (LIA NPS)', color: 'text-purple-500', suffix: '' },
] as const

export function StatsSummaryCards({ overview }: { overview: StatsOverview }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {ITEMS.map((item) => (
        <motion.div key={item.key} whileHover={{ y: -5 }} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-lg dark:border-white/5 dark:bg-carbon-900">
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-black ${item.color}`}>{overview[item.key]}{item.suffix}</p>
            {item.key === 'avgSatisfaction' ? <span className="text-sm font-bold text-gray-400 dark:opacity-40">/ 5</span> : null}
          </div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-muted">{item.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
