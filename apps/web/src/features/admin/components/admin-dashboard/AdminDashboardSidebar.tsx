'use client'

import type { ComponentProps, JSX } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '../../../../lib/utils/motion'
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  RocketLaunchIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

import type {
  AdminDashboardQuickActionIconMap,
  AdminDashboardQuickActionItem,
  AdminDashboardThemeColors,
} from './types'

const quickActionIcons: AdminDashboardQuickActionIconMap = {
  courses: PlusIcon,
  documents: DocumentTextIcon,
  engagement: ChartBarIcon,
  organizations: BuildingOffice2Icon,
  users: UsersIcon,
}

const SafeLink = Link as unknown as (
  props: ComponentProps<typeof Link>
) => JSX.Element

function AdminDashboardQuickAction({
  action,
  delay,
  themeColors,
}: {
  action: AdminDashboardQuickActionItem
  delay: number
  themeColors: AdminDashboardThemeColors
}) {
  const Icon = quickActionIcons[action.iconKey]

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      initial={{ opacity: 0, x: -20 }}
      transition={{ delay: delay * 0.1 + 0.5, duration: 0.4 }}
    >
      <SafeLink href={action.href}>
        <motion.div
          className="group flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:border-[#00D4B3]/50"
          style={{
            backgroundColor: themeColors.inputBg,
            borderColor: `${themeColors.borderColor}20`,
            color: themeColors.textPrimary,
          }}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`rounded-lg p-3 ${action.color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4
              className="text-sm font-semibold transition-colors group-hover:text-[#00D4B3]"
              style={{ color: themeColors.textPrimary }}
            >
              {action.title}
            </h4>
            <p className="mt-0.5 text-xs" style={{ color: themeColors.textSecondary }}>
              {action.description}
            </p>
          </div>
          <motion.div
            className="text-[#00D4B3]"
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M9 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </motion.div>
        </motion.div>
      </SafeLink>
    </motion.div>
  )
}

export function AdminDashboardSidebar({
  quickActions,
  themeColors,
}: {
  quickActions: AdminDashboardQuickActionItem[]
  themeColors: AdminDashboardThemeColors
}) {
  const { disableHeavy } = useMotionSafe()

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-24"
      initial={{ opacity: 0, x: 20 }}
      transition={{ delay: 0.5 }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>
          Acciones Rapidas
        </h2>
        <p className="mt-1 text-sm" style={{ color: themeColors.textSecondary }}>
          Accesos directos
        </p>
      </div>

      <div className="space-y-3">
        {quickActions.map((action, index) => (
          <AdminDashboardQuickAction
            key={action.title}
            action={action}
            delay={index}
            themeColors={themeColors}
          />
        ))}
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-2xl border border-[#10B981]/30 bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 p-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 1 }}
      >
        <div className="mb-4 flex items-center gap-3">
          {/* Icon pulse — static on mobile */}
          {disableHeavy
            ? <div className="rounded-lg bg-[#10B981] p-2"><RocketLaunchIcon className="h-5 w-5 text-white" /></div>
            : (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                className="rounded-lg bg-[#10B981] p-2"
                transition={{ duration: 2, repeat: Infinity }}
              >
                <RocketLaunchIcon className="h-5 w-5 text-white" />
              </motion.div>
            )
          }
          <div>
            <h3 className="font-semibold text-white">Sistema Saludable</h3>
            <p className="text-xs text-[#10B981]">Todos los servicios activos</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6C757D]">API</span>
            <span className="font-medium text-[#10B981]">Operativo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6C757D]">Base de Datos</span>
            <span className="font-medium text-[#10B981]">Operativo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6C757D]">SofLIA (IA)</span>
            <span className="font-medium text-[#10B981]">Activo</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
