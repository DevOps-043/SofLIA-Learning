import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'

import type { BusinessUserDashboardShellProps } from './types'

interface DashboardStatsHeaderProps {
  disableHeavyEffects: boolean
  interfaceTransition: Transition
  isOpen: boolean
  onToggle: () => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
}

export function DashboardStatsHeader({
  disableHeavyEffects,
  interfaceTransition,
  isOpen,
  onToggle,
  orgColors,
  t,
}: DashboardStatsHeaderProps) {
  return (
    <motion.div
      initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={disableHeavyEffects ? undefined : interfaceTransition}
      className="mb-4 flex items-center justify-between md:mb-6"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex-shrink-0 rounded-xl border p-2"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${orgColors.iconColor} 14.5%, transparent), color-mix(in srgb, ${orgColors.iconColor} 3.1%, transparent))`,
            borderColor: `color-mix(in srgb, ${orgColors.iconColor} 18.8%, transparent)`,
          }}
        >
          <TrendingUp className="h-5 w-5" style={{ color: orgColors.iconColor }} />
        </div>
        <div>
          <h2 className="text-lg font-bold md:text-xl" style={{ color: orgColors.text }}>
            {t('dashboard.generalStats', 'Tu Progreso')}
          </h2>
          <p className="text-xs md:text-sm" style={{ color: orgColors.textSecondary }}>
            {t('dashboard.keyMetrics', 'Metricas de tu aprendizaje')}
          </p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="ml-2 flex flex-shrink-0 items-center justify-center rounded-full p-2 transition-colors md:hidden"
        style={{ backgroundColor: `color-mix(in srgb, ${orgColors.iconColor} 8.2%, transparent)`, color: orgColors.iconColor }}
        aria-label={t('dashboard.stats.toggle', 'Alternar estadisticas')}
      >
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
    </motion.div>
  )
}
