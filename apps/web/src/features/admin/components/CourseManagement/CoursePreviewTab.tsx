'use client'

import { motion } from 'framer-motion'
import { useMotionSafe } from '../../../../lib/utils/motion'
import {
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  Lightbulb,
  Rocket,
  Sprout,
  Target,
  TrendingUp,
} from 'lucide-react'

import { useCourseManagementContext } from './CourseManagementContext'
import {
  COURSE_MANAGEMENT_ACCENT_BADGE_CLASS,
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
  COURSE_MANAGEMENT_ACCENT_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_CODE_BADGE_CLASS,
  COURSE_MANAGEMENT_DIVIDER_TOP_CLASS,
  COURSE_MANAGEMENT_EMPTY_STATE_CLASS,
  COURSE_MANAGEMENT_INFO_PANEL_CLASS,
  COURSE_MANAGEMENT_INSET_SURFACE_CLASS,
  COURSE_MANAGEMENT_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_LEVEL_BADGE_CLASSES,
  COURSE_MANAGEMENT_LOADING_SPINNER_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PREVIEW_ACTION_CARD_CLASS,
  COURSE_MANAGEMENT_PREVIEW_BUTTON_GLOW_CLASS,
  COURSE_MANAGEMENT_PREVIEW_FALLBACK_CLASS,
  COURSE_MANAGEMENT_PREVIEW_OVERLAY_CLASS,
  COURSE_MANAGEMENT_PREVIEW_PRIMARY_BUTTON_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_SOFT_PRIMARY_GRADIENT_CLASS,
  COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES,
  COURSE_MANAGEMENT_STATUS_BADGE_CLASS,
  COURSE_MANAGEMENT_SURFACE_CARD_CLASS,
  COURSE_MANAGEMENT_SURFACE_CARD_HOVER_CLASS,
} from './courseManagementTheme'

type PreviewStat = {
  Icon: typeof Clock
  label: string
  gradient: string
  getValue: (
    durationTotalMinutes: number,
    level: string,
    category: string,
    price: number
  ) => string
}

const previewStats: PreviewStat[] = [
  {
    Icon: Clock,
    label: 'Duracion',
    gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent,
    getValue: (durationTotalMinutes) => `${durationTotalMinutes} min`,
  },
  {
    Icon: BarChart3,
    label: 'Nivel',
    gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary,
    getValue: (durationTotalMinutes, level) =>
      level === 'beginner'
        ? 'Principiante'
        : level === 'intermediate'
          ? 'Intermedio'
          : 'Avanzado',
  },
  {
    Icon: Target,
    label: 'Categoria',
    gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success,
    getValue: (durationTotalMinutes, level, category) => category || 'General',
  },
  {
    Icon: DollarSign,
    label: 'Precio',
    gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.warning,
    getValue: (
      durationTotalMinutes: number,
      level: string,
      category: string,
      price: number
    ) => (price > 0 ? `$${price}` : 'Gratis'),
  },
] as const

export function CoursePreviewTab() {
  const { disableHeavy } = useMotionSafe()
  const { workshopPreview, previewLoading } = useCourseManagementContext().state

  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {previewLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={`mb-4 h-16 w-16 ${COURSE_MANAGEMENT_LOADING_SPINNER_CLASS}`}
          />
          <p className={`text-sm font-medium ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
            Cargando vista previa...
          </p>
        </div>
      ) : workshopPreview ? (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="group relative"
          >
            <div
              className={`relative overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl ${COURSE_MANAGEMENT_SURFACE_CARD_CLASS}`}
            >
              <div className="relative h-80 overflow-hidden">
                {workshopPreview.thumbnail_url ? (
                  <>
                    <motion.img
                      src={workshopPreview.thumbnail_url}
                      alt={workshopPreview.title}
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className={COURSE_MANAGEMENT_PREVIEW_OVERLAY_CLASS} />
                  </>
                ) : (
                  <div className={COURSE_MANAGEMENT_PREVIEW_FALLBACK_CLASS}>
                    <motion.div
                      animate={disableHeavy ? {} : {
                        scale: [1, 1.08, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Eye className={`h-24 w-24 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS} opacity-30`} />
                    </motion.div>
                  </div>
                )}

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute left-6 top-6"
                >
                  <span className={COURSE_MANAGEMENT_ACCENT_BADGE_CLASS}>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    {workshopPreview.category || 'Curso'}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute right-6 top-6"
                >
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md ${
                      workshopPreview.level === 'beginner'
                        ? COURSE_MANAGEMENT_LEVEL_BADGE_CLASSES.beginner
                        : workshopPreview.level === 'intermediate'
                          ? COURSE_MANAGEMENT_LEVEL_BADGE_CLASSES.intermediate
                          : COURSE_MANAGEMENT_LEVEL_BADGE_CLASSES.advanced
                    }`}
                  >
                    {workshopPreview.level === 'beginner' ? (
                      <span className="flex items-center gap-1.5">
                        <Sprout className="h-4 w-4" />
                        Principiante
                      </span>
                    ) : workshopPreview.level === 'intermediate' ? (
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4" />
                        Intermedio
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Rocket className="h-4 w-4" />
                        Avanzado
                      </span>
                    )}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 p-8"
                >
                  <h1 className="mb-3 text-4xl font-bold text-white drop-shadow-2xl">
                    {workshopPreview.title}
                  </h1>
                  <p className="line-clamp-2 text-lg leading-relaxed text-white/90 drop-shadow-lg">
                    {workshopPreview.description}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6 lg:col-span-2"
            >
              <div className={`p-8 ${COURSE_MANAGEMENT_SURFACE_CARD_HOVER_CLASS}`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl ${COURSE_MANAGEMENT_ICON_GRADIENT_CLASS}`}>
                    <span className="text-2xl text-white">CP</span>
                  </div>
                  <h2 className={`text-2xl font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
                    Sobre este curso
                  </h2>
                </div>
                <p className={`text-base leading-relaxed ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
                  {workshopPreview.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {previewStats.map((stat, index) => {
                  const Icon = stat.Icon

                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group relative"
                    >
                      <div
                        className={`relative overflow-hidden p-5 shadow-sm transition-all duration-300 hover:shadow-xl ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                        />
                        <div className="relative">
                          <div className="mb-2">
                            <Icon className={`h-6 w-6 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
                          </div>
                          <div
                            className={`mb-1 text-xs font-semibold uppercase tracking-wide ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}
                          >
                            {stat.label}
                          </div>
                          <div className={`text-lg font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
                            {stat.getValue(
                              workshopPreview.duration_total_minutes,
                              workshopPreview.level,
                              workshopPreview.category,
                              workshopPreview.price
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className={COURSE_MANAGEMENT_PREVIEW_ACTION_CARD_CLASS}>
                <div className="space-y-4">
                  <div className="mb-6 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 ${COURSE_MANAGEMENT_ACCENT_ICON_GRADIENT_CLASS}`}
                    >
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <h3 className={`text-lg font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
                      Vista Previa
                    </h3>
                  </div>

                  <motion.button
                    onClick={() => {
                      if (workshopPreview.slug) {
                        window.open(`/courses/${workshopPreview.slug}`, '_blank')
                      }
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={COURSE_MANAGEMENT_PREVIEW_PRIMARY_BUTTON_CLASS}
                  >
                    <div className={COURSE_MANAGEMENT_PREVIEW_BUTTON_GLOW_CLASS} />
                    <Eye className="relative z-10 h-5 w-5" />
                    <span className="relative z-10">Ver Pagina Publica</span>
                  </motion.button>

                  <div className={`space-y-3 ${COURSE_MANAGEMENT_DIVIDER_TOP_CLASS}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Estado</span>
                      <span className={COURSE_MANAGEMENT_STATUS_BADGE_CLASS}>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                        Publicado
                      </span>
                    </div>

                    {workshopPreview.slug ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>URL</span>
                        <code className={COURSE_MANAGEMENT_CODE_BADGE_CLASS}>
                          /{workshopPreview.slug}
                        </code>
                      </div>
                    ) : null}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className={COURSE_MANAGEMENT_INFO_PANEL_CLASS}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10">
                        <Lightbulb className={`h-4 w-4 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
                      </div>
                      <div>
                        <p className={`mb-1 text-xs font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
                          Vista Previa en Tiempo Real
                        </p>
                        <p className={`text-xs leading-relaxed ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
                          Esta es una vista previa de como se vera tu curso para los estudiantes.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={COURSE_MANAGEMENT_EMPTY_STATE_CLASS}
        >
          <div
            className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${COURSE_MANAGEMENT_SOFT_PRIMARY_GRADIENT_CLASS}`}
          >
            <Eye className={`h-10 w-10 ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`} />
          </div>
          <p className={`mb-2 text-lg font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
            No se encontro el curso
          </p>
          <p className={`text-sm ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
            Guarda la configuracion primero para ver la vista previa
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
