'use client'

import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  EnvelopeIcon,
  NoSymbolIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { colors } from '../shared'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

const ITEMS = [
  { key: 'total_users' as const, label: 'Total usuarios', color: colors.blue, icon: UserGroupIcon },
  { key: 'active_users' as const, label: 'Activos', color: colors.success, icon: CheckCircleIcon },
  { key: 'invited_users' as const, label: 'Invitados', color: colors.warning, icon: EnvelopeIcon },
  { key: 'max_users' as const, label: 'Máximo permitido', color: colors.accent, icon: NoSymbolIcon },
] as const

export function UsersStatsCards({ company }: { company: CompanyData }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {ITEMS.map((item, i) => {
        const Icon = item.icon
        const rawValue = company[item.key]
        const value = item.key === 'max_users' ? (rawValue ?? '∞') : (rawValue ?? 0)

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-carbon-800"
          >
            <div
              className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)` }}
            >
              <Icon className="h-5 w-5" style={{ color: item.color }} />
            </div>

            <p className="text-3xl font-black leading-none" style={{ color: item.color }}>
              {value}
            </p>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-white/40">
              {item.label}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
