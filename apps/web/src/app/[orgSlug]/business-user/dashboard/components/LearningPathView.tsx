'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, ChevronRight } from 'lucide-react'
import type { AssignedLearningPath, BusinessUserDashboardColors } from '../types'

interface LearningPathViewProps {
  learningPaths: AssignedLearningPath[]
  orgColors: BusinessUserDashboardColors
  onOpenCourse: (slug: string | null | undefined) => void
  t: (key: string, defaultValue?: string) => string
}

export function LearningPathView({ learningPaths, orgColors, onOpenCourse }: LearningPathViewProps) {
  if (learningPaths.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      {learningPaths.map((path, pathIndex) => (
        <motion.div
          key={path.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: pathIndex * 0.07 }}
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: orgColors.cardBg,
            border: `1px solid ${orgColors.border}`,
          }}
        >
          {/* Path header */}
          <div
            className="px-5 py-4 flex items-center justify-between gap-4"
            style={{
              borderBottom: `1px solid ${orgColors.border}`,
              background: `linear-gradient(135deg, ${orgColors.primary}10, ${orgColors.accent}06)`,
            }}
          >
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1"
                style={{ backgroundColor: `${orgColors.primary}18`, color: orgColors.primary }}
              >
                Ruta de aprendizaje
              </span>
              <h3 className="text-base font-bold" style={{ color: orgColors.text }}>
                {path.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: orgColors.textSecondary }}>
                {path.completedItemsCount} de {path.totalItemsCount} cursos completados
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-sm font-bold tabular-nums" style={{ color: orgColors.accent }}>
                {path.progressPercentage}%
              </span>
              <div
                className="h-1.5 w-28 rounded-full overflow-hidden"
                style={{ backgroundColor: orgColors.isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${path.progressPercentage}%`,
                    background: `linear-gradient(90deg, ${orgColors.primary}, ${orgColors.accent})`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sequential course list */}
          <div>
            {path.items.map((item, itemIndex) => {
              const isLocked = !item.isUnlocked
              const isCompleted = item.isCompleted

              return (
                <div
                  key={item.courseId}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-opacity duration-150 ${
                    isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-75'
                  }`}
                  style={{
                    opacity: isLocked ? 0.4 : 1,
                    borderBottom:
                      itemIndex < path.items.length - 1
                        ? `1px solid ${orgColors.border}50`
                        : undefined,
                  }}
                  onClick={() => {
                    if (!isLocked) onOpenCourse(item.slug)
                  }}
                >
                  {/* Position / status circle */}
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={
                      isCompleted
                        ? { backgroundColor: `${orgColors.accent}20`, color: orgColors.accent }
                        : isLocked
                          ? {
                              backgroundColor: orgColors.isLightMode
                                ? '#F1F5F9'
                                : 'rgba(255,255,255,0.06)',
                              color: orgColors.textMuted,
                            }
                          : { backgroundColor: `${orgColors.primary}18`, color: orgColors.primary }
                    }
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      item.position
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div
                    className="relative shrink-0 overflow-hidden rounded-xl"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: orgColors.isLightMode ? '#F1F5F9' : '#0F172A',
                    }}
                  >
                    <Image
                      src={item.thumbnail || '/images/course-placeholder.png'}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="52px"
                    />
                    {isLocked && <div className="absolute inset-0 bg-black/40" />}
                  </div>

                  {/* Course info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold line-clamp-1"
                      style={{ color: isLocked ? orgColors.textSecondary : orgColors.text }}
                    >
                      {item.title}
                    </p>

                    {isLocked ? (
                      <p className="text-[10px] mt-0.5" style={{ color: orgColors.textMuted }}>
                        Completa el curso anterior para desbloquear
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="h-1 rounded-full overflow-hidden"
                          style={{
                            width: 80,
                            backgroundColor: orgColors.isLightMode
                              ? '#E2E8F0'
                              : 'rgba(255,255,255,0.1)',
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.progress}%`,
                              background: `linear-gradient(90deg, ${orgColors.primary}, ${orgColors.accent})`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums" style={{ color: orgColors.textSecondary }}>
                          {item.progress}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right indicator */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: orgColors.accent }} />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" style={{ color: orgColors.textMuted }} />
                    ) : (
                      <ChevronRight className="w-4 h-4" style={{ color: orgColors.textSecondary }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
