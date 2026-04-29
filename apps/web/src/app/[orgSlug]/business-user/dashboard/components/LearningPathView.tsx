'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Lock, Play } from 'lucide-react'

import { OnboardingVideoPlayer } from '@/features/tours/components/OnboardingVideoPlayer'
import type { AssignedLearningPath, BusinessUserDashboardColors } from '../types'

/** Inyecta <link rel="prefetch"> para descargar el video en background antes de reproducirlo */
function prefetchVideo(url: string | null) {
  if (!url || typeof document === 'undefined') return
  const selector = `link[rel="prefetch"][href="${url}"]`
  if (document.head.querySelector(selector)) return
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.setAttribute('as', 'fetch')
  link.href = url
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

// ─── per-LP state ────────────────────────────────────────────────────────────

interface LpIntroState {
  introVideoUrl: string | null
  watched: boolean
  loading: boolean
  showPlayer: boolean
}

const INITIAL_INTRO: LpIntroState = {
  introVideoUrl: null,
  watched: false,
  loading: true,
  showPlayer: false,
}

// ─── LP card ─────────────────────────────────────────────────────────────────

interface LearningPathCardProps {
  path: AssignedLearningPath
  index: number
  orgSlug: string
  orgColors: BusinessUserDashboardColors
  onOpenCourse: (slug: string | null | undefined) => void
}

function LearningPathCard({
  path,
  index,
  orgSlug,
  orgColors,
  onOpenCourse,
}: LearningPathCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [intro, setIntro] = useState<LpIntroState>(INITIAL_INTRO)
  const fetchedRef = useRef(false)
  const autoPlayedRef = useRef(false)

  // ── Fetch intro video state once on mount ─────────────────────────────────
  useEffect(() => {
    if (fetchedRef.current || !orgSlug || !path.id) return
    fetchedRef.current = true

    fetch(`/api/${orgSlug}/business-user/lp/${path.id}/intro-video`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { success: boolean; introVideoUrl: string | null; watched: boolean } | null) => {
        if (!data?.success) {
          setIntro((prev) => ({ ...prev, loading: false }))
          return
        }
        // Prefetch en background — descarga el video antes de que el usuario lo abra
        prefetchVideo(data.introVideoUrl)
        setIntro((prev) => ({
          ...prev,
          introVideoUrl: data.introVideoUrl,
          watched: data.watched,
          loading: false,
        }))
      })
      .catch(() => setIntro((prev) => ({ ...prev, loading: false })))
  }, [orgSlug, path.id])

  // ── Auto-play on first view (once fetch is done, not yet watched) ─────────
  useEffect(() => {
    if (
      intro.loading ||
      !intro.introVideoUrl ||
      intro.watched ||
      autoPlayedRef.current
    ) return
    autoPlayedRef.current = true
    setIntro((prev) => ({ ...prev, showPlayer: true }))
  }, [intro.loading, intro.introVideoUrl, intro.watched])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const isReplayRef = useRef(false)

  const handleVideoComplete = useCallback(() => {
    const wasReplay = isReplayRef.current
    isReplayRef.current = false
    setIntro((prev) => ({ ...prev, showPlayer: false, watched: true }))
    // Solo marcar como visto en DB si era la primera vez (no replay)
    if (!wasReplay) {
      fetch(`/api/${orgSlug}/business-user/lp/${path.id}/intro-video`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {})
    }
  }, [orgSlug, path.id])

  const handleReplay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    isReplayRef.current = true
    setIntro((prev) => ({ ...prev, showPlayer: true }))
  }, [])

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), [])

  const hasVideo = Boolean(intro.introVideoUrl)

  return (
    <>
      {/* Full-screen intro video player */}
      {intro.showPlayer && intro.introVideoUrl && (
        <OnboardingVideoPlayer
          videos={[intro.introVideoUrl]}
          onComplete={handleVideoComplete}
          isSkippable={intro.watched}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07 }}
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: orgColors.cardBg, border: `1px solid ${orgColors.border}` }}
      >
        {/* ── Header (always visible) ── */}
        <div
          className="px-5 py-4"
          style={{
            borderBottom: expanded ? `1px solid ${orgColors.border}` : undefined,
            background: `linear-gradient(135deg, ${orgColors.primary}10, ${orgColors.accent}06)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1"
                style={{ backgroundColor: `${orgColors.primary}18`, color: orgColors.primary }}
              >
                Ruta de aprendizaje
              </span>
              <h3 className="text-base font-bold leading-snug" style={{ color: orgColors.text }}>
                {path.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: orgColors.textSecondary }}>
                {path.completedItemsCount} de {path.totalItemsCount} cursos completados
              </p>
            </div>

            {/* Right: progress + actions */}
            <div className="shrink-0 flex flex-col items-end gap-2">
              {/* Progress */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums" style={{ color: orgColors.accent }}>
                  {path.progressPercentage}%
                </span>
                <div
                  className="h-1.5 w-24 rounded-full overflow-hidden"
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

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Ver intro button — visible siempre que haya video configurado */}
                {hasVideo && !intro.loading && (
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80 active:scale-95"
                    style={{
                      backgroundColor: `${orgColors.primary}14`,
                      color: orgColors.primary,
                      border: `1px solid ${orgColors.primary}28`,
                    }}
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Ver intro
                  </button>
                )}

                {/* Collapse toggle */}
                <button
                  type="button"
                  onClick={toggleExpanded}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-70 active:scale-95"
                  style={{
                    backgroundColor: orgColors.isLightMode ? '#F1F5F9' : 'rgba(255,255,255,0.08)',
                    color: orgColors.textSecondary,
                  }}
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Collapsible course list ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="courses"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
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
                    onClick={() => { if (!isLocked) onOpenCourse(item.slug) }}
                  >
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={
                        isCompleted
                          ? { backgroundColor: `${orgColors.accent}20`, color: orgColors.accent }
                          : isLocked
                            ? { backgroundColor: orgColors.isLightMode ? '#F1F5F9' : 'rgba(255,255,255,0.06)', color: orgColors.textMuted }
                            : { backgroundColor: `${orgColors.primary}18`, color: orgColors.primary }
                      }
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : item.position}
                    </div>

                    <div
                      className="relative shrink-0 overflow-hidden rounded-xl"
                      style={{ width: 52, height: 52, backgroundColor: orgColors.isLightMode ? '#F1F5F9' : '#0F172A' }}
                    >
                      <Image src={item.thumbnail || '/images/course-placeholder.png'} alt={item.title} fill className="object-cover" sizes="52px" />
                      {isLocked && <div className="absolute inset-0 bg-black/40" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: isLocked ? orgColors.textSecondary : orgColors.text }}>
                        {item.title}
                      </p>
                      {isLocked ? (
                        <p className="text-[10px] mt-0.5" style={{ color: orgColors.textMuted }}>
                          Completa el curso anterior para desbloquear
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="h-1 rounded-full overflow-hidden" style={{ width: 80, backgroundColor: orgColors.isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: `linear-gradient(90deg, ${orgColors.primary}, ${orgColors.accent})` }} />
                          </div>
                          <span className="text-[10px] tabular-nums" style={{ color: orgColors.textSecondary }}>{item.progress}%</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" style={{ color: orgColors.accent }} /> : isLocked ? <Lock className="w-4 h-4" style={{ color: orgColors.textMuted }} /> : <ChevronRight className="w-4 h-4" style={{ color: orgColors.textSecondary }} />}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ─── Public export ───────────────────────────────────────────────────────────

interface LearningPathViewProps {
  learningPaths: AssignedLearningPath[]
  orgColors: BusinessUserDashboardColors
  orgSlug: string
  onOpenCourse: (slug: string | null | undefined) => void
  t: (key: string, defaultValue?: string) => string
}

export function LearningPathView({ learningPaths, orgColors, orgSlug, onOpenCourse }: LearningPathViewProps) {
  if (learningPaths.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      {learningPaths.map((path, index) => (
        <LearningPathCard
          key={path.id}
          path={path}
          index={index}
          orgSlug={orgSlug}
          orgColors={orgColors}
          onOpenCourse={onOpenCourse}
        />
      ))}
    </div>
  )
}
