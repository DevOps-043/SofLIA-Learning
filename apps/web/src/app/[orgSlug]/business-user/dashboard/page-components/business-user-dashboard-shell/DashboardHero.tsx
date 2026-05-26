import { motion, type Transition } from 'framer-motion'

import { BusinessUserGreeting } from './BusinessUserGreeting'
import { HeroBackground } from './HeroBackground'
import { HeroBorderOverlay, HeroDecorations } from './HeroDecorations'
import type { BusinessUserDashboardShellProps } from './types'

interface DashboardHeroProps {
  disableHeavyEffects: boolean
  interfaceTransition: Transition
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
  user: BusinessUserDashboardShellProps['user']
}

export function DashboardHero({
  disableHeavyEffects,
  interfaceTransition,
  orgColors,
  t,
  user,
}: DashboardHeroProps) {
  const motionInitial = disableHeavyEffects ? false : { opacity: 0, y: -20 }
  const motionAnimate = disableHeavyEffects ? undefined : { opacity: 1, y: 0 }
  const motionTransition = disableHeavyEffects ? undefined : interfaceTransition

  return (
    <div
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
        <div className="relative z-10">
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
        {!disableHeavyEffects ? <HeroBorderOverlay orgColors={orgColors} /> : null}
      </motion.div>
    </div>
  )
}
