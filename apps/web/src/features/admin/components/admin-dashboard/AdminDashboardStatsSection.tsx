'use client'

import type { ComponentProps, JSX } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

import type {
  AdminDashboardStatIconMap,
  AdminDashboardStatItem,
  AdminDashboardThemeColors,
} from './types'

const statIcons: AdminDashboardStatIconMap = {
  courses: BookOpenIcon,
  engagement: ChartBarIcon,
  organizations: BuildingOffice2Icon,
  users: UsersIcon,
}

const SafeLink = Link as unknown as (
  props: ComponentProps<typeof Link>
) => JSX.Element

function AdminDashboardStatCard({
  delay,
  stat,
  themeColors,
}: {
  delay: number
  stat: AdminDashboardStatItem
  themeColors: AdminDashboardThemeColors
}) {
  const isPositive = stat.change >= 0
  const Icon = statIcons[stat.iconKey]

  return (
    <SafeLink href={stat.href}>
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border p-6"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: `${themeColors.borderColor}20`,
        }}
        transition={{
          delay: delay * 0.1,
          duration: 0.5,
          stiffness: 100,
          type: 'spring',
        }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 },
          y: -5,
        }}
      >
        <div
          className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${stat.gradient}`}
        />
        <motion.div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#00D4B3]/10 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <motion.div
              className={`rounded-xl p-3 shadow-lg ${stat.gradient}`}
              whileHover={{
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.5 },
              }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>

            <motion.div
              animate={{ scale: 1 }}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                isPositive
                  ? 'bg-[#10B981]/20 text-[#10B981]'
                  : 'bg-red-500/20 text-red-400'
              }`}
              initial={{ scale: 0 }}
              transition={{ delay: delay * 0.1 + 0.3, type: 'spring' }}
            >
              {isPositive ? (
                <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
              ) : (
                <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
              )}
              {isPositive ? '+' : ''}
              {stat.change}%
            </motion.div>
          </div>

          <motion.h3
            animate={{ opacity: 1, x: 0 }}
            className="mb-1 text-3xl font-bold tracking-tight"
            initial={{ opacity: 0, x: -10 }}
            style={{ color: themeColors.textPrimary }}
            transition={{ delay: delay * 0.1 + 0.2 }}
          >
            {typeof stat.value === 'number'
              ? stat.value.toLocaleString()
              : stat.value}
          </motion.h3>

          <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
            {stat.title}
          </p>

          <motion.div
            animate={{ width: '30%' }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#00D4B3] to-[#0A2540]"
            initial={{ width: 0 }}
            transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
          />
        </div>
      </motion.div>
    </SafeLink>
  )
}

export function AdminDashboardStatsSection({
  error,
  isLoading,
  statsData,
  themeColors,
}: {
  error: string | null
  isLoading: boolean
  statsData: AdminDashboardStatItem[]
  themeColors: AdminDashboardThemeColors
}) {
  return (
    <section>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>
            Estadisticas Generales
          </h2>
          <p className="mt-1 text-sm" style={{ color: themeColors.textSecondary }}>
            Metricas clave de la plataforma
          </p>
        </div>
        <SafeLink
          href="/admin/reportes"
          className="rounded-lg border border-[#00D4B3]/30 px-4 py-2 text-sm font-medium text-[#00D4B3] transition-colors hover:bg-[#00D4B3]/10"
          style={{ backgroundColor: themeColors.cardBackground }}
        >
          Ver Reportes
        </SafeLink>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl"
              style={{ backgroundColor: themeColors.cardBackground }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">Error al cargar estadisticas: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statsData.map((stat, index) => (
            <AdminDashboardStatCard
              key={stat.title}
              delay={index}
              stat={stat}
              themeColors={themeColors}
            />
          ))}
        </div>
      )}
    </section>
  )
}
