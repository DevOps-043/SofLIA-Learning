'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Lock, PlayCircle, Route } from 'lucide-react'
import type {
  AssignedLearningPath,
  AssignedLearningPathItem,
  BusinessUserDashboardColors,
} from '../types'

interface LearningPathCardProps {
  learningPath: AssignedLearningPath
  index: number
  orgColors: BusinessUserDashboardColors
  onOpenCourse: (slug: string | null | undefined) => void
  t: (key: string, defaultValue?: string) => string
}

function getItemStatusLabel(
  item: AssignedLearningPathItem,
  t: LearningPathCardProps['t'],
) {
  if (item.status === 'completed') {
    return t('dashboard.learningPaths.status.completed', 'Completado')
  }

  if (item.status === 'available') {
    return t('dashboard.learningPaths.status.available', 'Disponible')
  }

  return t('dashboard.learningPaths.status.locked', 'Bloqueado')
}

function getItemIcon(item: AssignedLearningPathItem) {
  if (item.status === 'completed') return CheckCircle2
  if (item.status === 'available') return PlayCircle
  return Lock
}

export function LearningPathCard({
  learningPath,
  index,
  orgColors,
  onOpenCourse,
  t,
}: LearningPathCardProps) {
  const nextItem = learningPath.items.find(
    (item) => item.slug === learningPath.nextCourseSlug,
  )
  const isCompleted = learningPath.progressPercentage >= 100

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      className="overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: orgColors.cardBg,
        borderColor: orgColors.border,
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: `${orgColors.iconColor}18`,
                  borderColor: `${orgColors.iconColor}30`,
                }}
              >
                <Route className="h-4 w-4" style={{ color: orgColors.iconColor }} />
              </span>
              <span
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: orgColors.textSecondary }}
              >
                {t('dashboard.learningPaths.badge', 'Ruta de aprendizaje')}
              </span>
            </div>

            <h3 className="text-xl font-bold" style={{ color: orgColors.text }}>
              {learningPath.title}
            </h3>
            {learningPath.description ? (
              <p className="mt-2 max-w-3xl text-sm" style={{ color: orgColors.textSecondary }}>
                {learningPath.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!learningPath.nextCourseSlug || isCompleted}
            onClick={() => onOpenCourse(learningPath.nextCourseSlug)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: orgColors.iconColor,
              color: orgColors.isLightMode ? orgColors.cardBg : orgColors.sidebarBg,
            }}
          >
            <PlayCircle className="h-4 w-4" />
            {isCompleted
              ? t('dashboard.learningPaths.completedCta', 'Ruta completada')
              : t('dashboard.learningPaths.continueCta', 'Continuar ruta')}
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold">
            <span style={{ color: orgColors.textSecondary }}>
              {t('dashboard.learningPaths.progress', 'Progreso')}
            </span>
            <span style={{ color: orgColors.text }}>
              {learningPath.completedItemsCount}/{learningPath.totalItemsCount}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: `${orgColors.textMuted}25` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${learningPath.progressPercentage}%`,
                backgroundColor: orgColors.iconColor,
              }}
            />
          </div>
        </div>

        {nextItem ? (
          <div
            className="mt-5 rounded-xl border px-4 py-3"
            style={{
              backgroundColor: `${orgColors.iconColor}10`,
              borderColor: `${orgColors.iconColor}25`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: orgColors.textSecondary }}>
              {t('dashboard.learningPaths.nextCourse', 'Siguiente curso')}
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: orgColors.text }}>
              {nextItem.position}. {nextItem.title}
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2">
          {learningPath.items.map((item) => {
            const Icon = getItemIcon(item)
            const canOpen = item.isUnlocked && Boolean(item.slug)

            return (
              <button
                key={`${learningPath.id}-${item.courseId}-${item.position}`}
                type="button"
                disabled={!canOpen}
                onClick={() => onOpenCourse(item.slug)}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition enabled:hover:translate-x-1 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    item.status === 'locked'
                      ? `${orgColors.textMuted}10`
                      : `${orgColors.iconColor}08`,
                  borderColor:
                    item.status === 'locked'
                      ? `${orgColors.textMuted}25`
                      : `${orgColors.iconColor}25`,
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor:
                        item.status === 'locked'
                          ? `${orgColors.textMuted}18`
                          : `${orgColors.iconColor}18`,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{
                        color:
                          item.status === 'locked'
                            ? orgColors.textMuted
                            : orgColors.iconColor,
                      }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-sm font-semibold"
                      style={{ color: orgColors.text }}
                    >
                      {item.position}. {item.title}
                    </span>
                    <span className="block text-xs" style={{ color: orgColors.textSecondary }}>
                      {item.progress}% {t('dashboard.learningPaths.itemProgress', 'avance')}
                    </span>
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    backgroundColor:
                      item.status === 'locked'
                        ? `${orgColors.textMuted}18`
                        : `${orgColors.iconColor}18`,
                    color:
                      item.status === 'locked' ? orgColors.textMuted : orgColors.iconColor,
                  }}
                >
                  {getItemStatusLabel(item, t)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </motion.article>
  )
}
