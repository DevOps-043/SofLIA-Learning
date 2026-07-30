import { Award, BarChart3, BookOpen, type LucideIcon } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'

import { BusinessUserGreeting } from './BusinessUserGreeting'
import { HeroBackground } from './HeroBackground'
import { HeroDecorations } from './HeroDecorations'
import type { BusinessUserDashboardShellProps } from './types'
import styles from '../BusinessUserDashboard.module.css'

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
  description: string
  icon: LucideIcon
  id: string
  onClick: () => void
  title: string
}

function DashboardHeroQuickAccessButton({ action }: { action: QuickAccessAction }) {
  const Icon = action.icon

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={styles.quickAction}
      aria-label={`${action.title}. ${action.description}`}
    >
      <span className={styles.quickIcon} aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span className={styles.quickTitle}>{action.title}</span>
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
  const motionInitial = disableHeavyEffects ? false : { opacity: 0, y: -16 }
  const motionAnimate = disableHeavyEffects ? undefined : { opacity: 1, y: 0 }
  const motionTransition = disableHeavyEffects ? undefined : interfaceTransition
  const quickAccessActions: QuickAccessAction[] = [
    {
      description: t('dashboard.quickActions.myStats.desc', 'Consulta tu avance'),
      icon: BarChart3,
      id: 'analytics',
      onClick: handleAnalyticsClick,
      title: t('dashboard.quickActions.myStats.title', 'Mis estadísticas'),
    },
    {
      description: t('dashboard.quickActions.certificates.desc', 'Revisa tus logros'),
      icon: Award,
      id: 'certificates',
      onClick: handleCertificatesClick,
      title: t('dashboard.quickActions.certificates.title', 'Mis certificados'),
    },
    {
      description: t('dashboard.quickActions.notebook.desc', 'Abre tus notas'),
      icon: BookOpen,
      id: 'notebook',
      onClick: handleNotebookClick,
      title: t('dashboard.quickActions.notebook.title', 'Libro de apuntes'),
    },
  ]

  return (
    <section
      data-tour-id="business-user-dashboard--hero"
      className="scroll-mt-28"
    >
      <motion.div
        initial={motionInitial}
        animate={motionAnimate}
        transition={motionTransition}
        className={styles.hero}
      >
        <HeroBackground disableHeavyEffects={disableHeavyEffects} orgColors={orgColors} />
        {!disableHeavyEffects ? <HeroDecorations orgColors={orgColors} /> : null}
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <motion.p
              className={styles.eyebrow}
              initial={disableHeavyEffects ? false : { opacity: 0, x: -12 }}
              animate={disableHeavyEffects ? undefined : { opacity: 1, x: 0 }}
              transition={motionTransition}
            >
              {t('dashboard.learningSpace', 'Tu espacio de aprendizaje')}
            </motion.p>
            <motion.h1
              className={styles.heroTitle}
              initial={disableHeavyEffects ? false : { opacity: 0, y: 12 }}
              animate={motionAnimate}
              transition={motionTransition}
            >
              <BusinessUserGreeting firstName={user?.first_name} t={t} />.
            </motion.h1>
            <motion.p
              className={styles.heroSubtitle}
              initial={disableHeavyEffects ? false : { opacity: 0, y: 12 }}
              animate={motionAnimate}
              transition={motionTransition}
            >
              {t('dashboard.userSubtitle')}
            </motion.p>
          </div>
          <motion.div
            initial={disableHeavyEffects ? false : { opacity: 0, x: 14 }}
            animate={disableHeavyEffects ? undefined : { opacity: 1, x: 0 }}
            transition={motionTransition}
            className={styles.quickPanel}
            aria-label={t('dashboard.quickActions.title', 'Accesos directos')}
          >
            <div className={styles.quickGrid}>
              {quickAccessActions.map((action) => (
                <DashboardHeroQuickAccessButton key={action.id} action={action} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
