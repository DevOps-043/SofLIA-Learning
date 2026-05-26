import { Award, BarChart3, BookOpen, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { motion, type Transition } from 'framer-motion'

import { BusinessUserGreeting } from './BusinessUserGreeting'
import { HeroBackground } from './HeroBackground'
import { HeroBorderOverlay, HeroDecorations } from './HeroDecorations'
import type { BusinessUserDashboardShellProps } from './types'

interface DashboardHeroProps {
  disableHeavyEffects: boolean
  handleAnalyticsClick: BusinessUserDashboardShellProps['handleAnalyticsClick']
  handleCertificatesClick: BusinessUserDashboardShellProps['handleCertificatesClick']
  handleNotebookClick: BusinessUserDashboardShellProps['handleNotebookClick']
  interfaceTransition: Transition
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
  user: BusinessUserDashboardShellProps['user']
}

interface QuickAccessAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
}

function DashboardHeroQuickAccessButton({ action }: { action: QuickAccessAction }) {
  const Icon = action.icon

  return (
    <button
      type="button"
      onClick={action.onClick}
      className="group flex min-h-12 min-w-0 items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left text-white shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold sm:text-sm">{action.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/70">{action.description}</span>
      </span>
    </button>
  )
}

export function DashboardHero({
  disableHeavyEffects,
  handleAnalyticsClick,
  handleCertificatesClick,
  handleNotebookClick,
  interfaceTransition,
  orgColors,
  t,
  user,
}: DashboardHeroProps) {
  const motionInitial = disableHeavyEffects ? false : { opacity: 0, y: -20 }
  const motionAnimate = disableHeavyEffects ? undefined : { opacity: 1, y: 0 }
  const motionTransition = disableHeavyEffects ? undefined : interfaceTransition

  const quickAccessActions = useMemo<QuickAccessAction[]>(
    () => [
      {
        id: 'analytics',
        title: t('dashboard.quickActions.myStats.title', 'Mis estadísticas'),
        description: t('dashboard.quickActions.myStats.desc', 'Consulta tu avance'),
        icon: BarChart3,
        onClick: handleAnalyticsClick,
      },
      {
        id: 'certificates',
        title: t('dashboard.quickActions.certificates.title', 'Mis certificados'),
        description: t('dashboard.quickActions.certificates.desc', 'Revisa tus logros'),
        icon: Award,
        onClick: handleCertificatesClick,
      },
      {
        id: 'notebook',
        title: t('dashboard.quickActions.notebook.title', 'Libro de apuntes'),
        description: t('dashboard.quickActions.notebook.desc', 'Abre tus notas'),
        icon: BookOpen,
        onClick: handleNotebookClick,
      },
    ],
    [handleAnalyticsClick, handleCertificatesClick, handleNotebookClick, t],
  )

  return (
    <div
      data-tour-id="business-user-dashboard--hero"
      className="mb-5 scroll-mt-28 md:mb-8"
    >
      <motion.div
        initial={motionInitial}
        animate={motionAnimate}
        transition={motionTransition}
        className="group relative overflow-hidden rounded-xl px-4 pb-7 pt-4 md:rounded-2xl md:px-6 md:pb-8 md:pt-5 lg:px-8 lg:pb-10 lg:pt-6"
      >
        <HeroBackground disableHeavyEffects={disableHeavyEffects} orgColors={orgColors} />
        {!disableHeavyEffects ? <HeroDecorations orgColors={orgColors} /> : null}
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <motion.h1
              className="mb-1.5 text-2xl font-bold leading-tight md:mb-2 md:text-3xl lg:text-4xl"
              style={{ color: 'var(--color-bg-light)' }}
              initial={disableHeavyEffects ? false : { opacity: 0, y: 20 }}
              animate={motionAnimate}
              transition={motionTransition}
            >
              <BusinessUserGreeting firstName={user?.first_name} t={t} />
            </motion.h1>
            <motion.p
              className="max-w-xl text-xs line-clamp-2 md:text-sm md:line-clamp-none lg:text-base"
              style={{ color: 'rgb(255 255 255 / 80%)' }}
              initial={disableHeavyEffects ? false : { opacity: 0, y: 20 }}
              animate={motionAnimate}
              transition={motionTransition}
            >
              {t('dashboard.subtitle')}
            </motion.p>
          </div>
          <motion.div
            initial={disableHeavyEffects ? false : { opacity: 0, y: 16 }}
            animate={motionAnimate}
            transition={motionTransition}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[480px] lg:max-w-[560px]"
            aria-label={t('dashboard.quickActions.title', 'Accesos rápidos')}
          >
            {quickAccessActions.map((action) => (
              <DashboardHeroQuickAccessButton key={action.id} action={action} />
            ))}
          </motion.div>
        </div>
        {!disableHeavyEffects ? <HeroBorderOverlay orgColors={orgColors} /> : null}
      </motion.div>
    </div>
  )
}
