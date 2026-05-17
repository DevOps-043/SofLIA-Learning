import { BookOpen, GraduationCap, Sparkles } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'

import type { BusinessUserDashboardShellProps } from './types'

interface EmptyCoursesStateProps {
  disableHeavyEffects: boolean
  interfaceTransition: Transition
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
}

export function EmptyCoursesState({
  disableHeavyEffects,
  interfaceTransition,
  orgColors,
  t,
}: EmptyCoursesStateProps) {
  return (
    <motion.div
      initial={disableHeavyEffects ? false : { opacity: 0, scale: 0.98 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-2xl p-12 text-center ${disableHeavyEffects ? '' : 'backdrop-blur-xl'}`}
      style={{
        backgroundColor: orgColors.cardBg,
        border: `1px solid ${orgColors.border}`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${orgColors.primary}15, transparent 60%)` }}
      />
      <motion.div
        initial={disableHeavyEffects ? false : { scale: 0.8 }}
        animate={disableHeavyEffects ? undefined : { scale: 1 }}
        transition={disableHeavyEffects ? undefined : interfaceTransition}
        className="relative z-10"
      >
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: `${orgColors.iconColor}15`,
            borderColor: `${orgColors.iconColor}30`,
          }}
        >
          <BookOpen className="h-10 w-10" style={{ color: orgColors.iconColor }} />
        </div>
        <h3 className="mb-2 text-xl font-bold" style={{ color: orgColors.text }}>
          {t('dashboard.emptyCourses.title', 'No tienes cursos asignados aun')}
        </h3>
        <p className="mx-auto max-w-md" style={{ color: orgColors.textSecondary }}>
          {t(
            'dashboard.emptyCourses.description',
            'Tu organizacion te asignara cursos proximamente. Mientras tanto, explora lo que tenemos preparado para ti.',
          )}
        </p>
        <Sparkles className="absolute right-6 top-6 h-5 w-5" style={{ color: `${orgColors.iconColor}50` }} />
        <GraduationCap className="absolute bottom-8 left-8 h-6 w-6" style={{ color: `${orgColors.iconColor}50` }} />
      </motion.div>
      {!disableHeavyEffects ? <EmptyCoursesBorder orgColors={orgColors} /> : null}
    </motion.div>
  )
}

function EmptyCoursesBorder({
  orgColors,
}: Pick<EmptyCoursesStateProps, 'orgColors'>) {
  return (
    <div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${orgColors.primary}30, transparent, ${orgColors.accent}15)`,
        padding: '1px',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
      }}
    />
  )
}
