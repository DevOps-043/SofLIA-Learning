'use client'

import Image from 'next/image'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Check, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Lock, Play, Sparkles } from 'lucide-react'

import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '../../../../../core/constants/tourTargets'
import { OnboardingVideoPlayer } from '../../../../../features/tours/components/OnboardingVideoPlayer'
import type {
  AssignedCourse,
  AssignedLearningPath,
  AssignedLearningPathItem,
  BusinessUserDashboardColors,
} from '../types'

interface LearningPathViewProps {
  learningPaths: AssignedLearningPath[]
  assignedCourses: AssignedCourse[]
  orgColors: BusinessUserDashboardColors
  orgSlug: string
  onOpenCourse: (slug: string | null | undefined) => void
  onCourseClick: (course: AssignedCourse) => void
  onCertificateClick?: (course: AssignedCourse) => void
  disableHeavyEffects?: boolean
  t: (key: string, defaultValue?: string) => string
}

interface LearningPathCourseTileProps {
  course: AssignedCourse
  item: AssignedLearningPathItem
  learningPathTitle: string
  orgColors: BusinessUserDashboardColors
  onOpen: () => void
  onCertificateClick?: () => void
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  t: LearningPathViewProps['t']
  disableHeavyEffects: boolean
}

interface IntroVideoState {
  introVideoUrl: string | null
  watched: boolean
  loading: boolean
  showPlayer: boolean
}

interface IntroVideoResponse {
  success?: boolean
  introVideoUrl?: string | null
  watched?: boolean
}

interface InfoHoverCardContent {
  key: string
  kind: 'course' | 'learning_path'
  targetId: string
  title: string
  meta: string
  description: string
  points: string[]
  progress?: number
  status?: string
  loading?: boolean
  source?: 'gemini' | 'fallback'
  model?: string
}

interface InfoHoverCardState extends InfoHoverCardContent {
  rect: DOMRect
}

interface GeminiPreviewResponse {
  success?: boolean
  description?: string
  points?: string[]
  source?: 'gemini' | 'fallback'
  model?: string
}

const INITIAL_VISIBLE_PATH_ITEMS = 6
const PATH_ITEMS_INCREMENT = 6

function formatTranslation(
  t: LearningPathViewProps['t'],
  key: string,
  defaultValue: string,
  replacements: Record<string, string | number>,
) {
  let text = t(key, defaultValue)
  for (const [name, value] of Object.entries(replacements)) {
    text = text.split(`{{${name}}}`).join(String(value))
  }
  return text
}

function getItemCourseStatus(item: AssignedLearningPathItem): AssignedCourse['status'] {
  if (item.isCompleted || item.progress >= 100) return 'Completado'
  if (item.progress > 0) return 'En progreso'
  return 'Asignado'
}

function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0
  return Math.max(0, Math.min(100, progress))
}

function buildCourseFromPathItem(
  item: AssignedLearningPathItem,
  learningPath: AssignedLearningPath,
  t: LearningPathViewProps['t'],
): AssignedCourse {
  return {
    id: `${learningPath.id}-${item.courseId}`,
    course_id: item.courseId,
    title: item.title || t('dashboard.learningPaths.courseFallback', 'Curso sin titulo'),
    instructor: learningPath.title,
    progress: clampProgress(item.progress),
    status: getItemCourseStatus(item),
    thumbnail: item.thumbnail || '/images/course-placeholder.png',
    slug: item.slug ?? '',
    assigned_at: '',
    has_certificate: item.hasCertificate,
  }
}

function getIntroFallback(isLoading: boolean): IntroVideoState {
  return {
    introVideoUrl: null,
    watched: false,
    loading: isLoading,
    showPlayer: false,
  }
}

function buildCoursePreviewContent(
  course: AssignedCourse,
  item: AssignedLearningPathItem,
  learningPathTitle: string,
  t: LearningPathViewProps['t'],
): InfoHoverCardContent {
  const progress = clampProgress(course.progress)
  const status = !item.isUnlocked
    ? t('dashboard.learningPaths.status.locked', 'Bloqueado')
    : progress >= 100
      ? t('dashboard.learningPaths.status.completed', 'Completado')
      : course.status

  return {
    key: `course:${course.course_id}`,
    kind: 'course',
    targetId: course.course_id,
    title: course.title,
    meta: formatTranslation(
      t,
      'dashboard.learningPaths.coursePreviewMeta',
      'Curso {{position}} de la ruta {{pathTitle}}',
      { position: item.position, pathTitle: learningPathTitle },
    ),
    description: t('dashboard.learningPaths.previewLoading', 'Gemini esta analizando la descripcion real y el contexto de aprendizaje.'),
    points: [],
    progress,
    status,
    loading: true,
  }
}

function buildLearningPathPreviewContent(
  learningPath: AssignedLearningPath,
  t: LearningPathViewProps['t'],
): InfoHoverCardContent {
  return {
    key: `learning_path:${learningPath.id}`,
    kind: 'learning_path',
    targetId: learningPath.id,
    title: learningPath.title,
    meta: formatTranslation(
      t,
      'dashboard.learningPaths.pathPreviewMeta',
      '{{count}} cursos en secuencia',
      { count: learningPath.totalItemsCount },
    ),
    description: t('dashboard.learningPaths.previewLoading', 'Gemini esta analizando la descripcion real y el contexto de aprendizaje.'),
    points: [],
    progress: clampProgress(learningPath.progressPercentage),
    status: formatTranslation(
      t,
      'dashboard.learningPaths.pathPreviewStatus',
      '{{completed}} de {{total}} completados',
      {
        completed: learningPath.completedItemsCount,
        total: learningPath.totalItemsCount,
      },
    ),
    loading: true,
  }
}

function getHoverCardPosition(rect: DOMRect) {
  const width = 380
  const gap = 12
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 720 : window.innerHeight
  const maxHeight = Math.min(520, viewportHeight - gap * 2)
  const fitsRight = rect.right + gap + width <= viewportWidth - gap
  const fitsLeft = rect.left - gap - width >= gap
  const left = fitsRight
    ? rect.right + gap
    : fitsLeft
      ? rect.left - gap - width
      : Math.max(gap, Math.min(rect.left, viewportWidth - width - gap))
  const top = Math.max(gap, Math.min(rect.top - 110, viewportHeight - maxHeight - gap))

  return {
    left,
    top,
    width,
    maxHeight,
    arrowSide: fitsRight ? 'left' : fitsLeft ? 'right' : 'none',
  }
}

function InfoHoverCard({
  card,
  orgColors,
  onMouseEnter,
  onMouseLeave,
  t,
}: {
  card: InfoHoverCardState
  orgColors: BusinessUserDashboardColors
  onMouseEnter: () => void
  onMouseLeave: () => void
  t: LearningPathViewProps['t']
}) {
  const position = getHoverCardPosition(card.rect)
  const badgeLabel = card.loading
    ? t('dashboard.learningPaths.previewLoadingBadge', 'Analizando')
    : card.source === 'gemini'
      ? t('dashboard.learningPaths.geminiPreviewBadge', 'Analisis Gemini')
      : t('dashboard.learningPaths.previewBadge', 'Resumen')

  return (
    <div
      className="fixed z-[80] rounded-lg border p-5 shadow-2xl"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
        overflowY: 'auto',
        backgroundColor: orgColors.cardBg,
        borderColor: orgColors.border,
        color: orgColors.text,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
      aria-label={card.title}
    >
      {position.arrowSide !== 'none' ? (
        <span
          className={`absolute top-12 h-4 w-4 rotate-45 border ${
            position.arrowSide === 'left' ? '-left-2 border-r-0 border-t-0' : '-right-2 border-b-0 border-l-0'
          }`}
          style={{
            backgroundColor: orgColors.cardBg,
            borderColor: orgColors.border,
          }}
        />
      ) : null}

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: `${orgColors.iconColor}18`, color: orgColors.iconColor }}>
        {card.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {badgeLabel}
      </div>

      <h3 className="text-lg font-bold leading-snug" style={{ color: orgColors.text }}>
        {card.title}
      </h3>
      <p className="mt-1 text-xs font-semibold" style={{ color: orgColors.textSecondary }}>
        {card.meta}
      </p>

      <div className="mt-3 flex items-center gap-3">
        {typeof card.progress === 'number' ? (
          <span className="text-sm font-bold tabular-nums" style={{ color: orgColors.iconColor }}>
            {Math.round(card.progress)}%
          </span>
        ) : null}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: `${orgColors.textMuted}24` }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${card.progress ?? 0}%`,
              backgroundColor: orgColors.iconColor,
            }}
          />
        </div>
      </div>
      {card.status ? (
        <p className="mt-2 text-xs font-semibold" style={{ color: orgColors.textSecondary }}>
          {card.status}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed" style={{ color: orgColors.textSecondary }}>
        {card.description}
      </p>

      {card.loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-4 rounded-full" style={{ backgroundColor: `${orgColors.textMuted}20` }} />
          ))}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {card.points.map((point) => (
            <li key={point} className="flex gap-2 text-sm leading-snug" style={{ color: orgColors.text }}>
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: orgColors.iconColor }} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LearningPathCourseTile({
  course,
  item,
  learningPathTitle,
  orgColors,
  onOpen,
  onCertificateClick,
  onPreview,
  onPreviewEnd,
  t,
  disableHeavyEffects,
}: LearningPathCourseTileProps) {
  const progress = clampProgress(course.progress)
  const isLocked = !item.isUnlocked
  const isCompleted = item.isCompleted || progress >= 100
  const canOpen = !isLocked && Boolean(course.slug || item.slug)
  const statusLabel = isLocked
    ? t('dashboard.learningPaths.lockedHint', 'Completa el curso anterior')
    : isCompleted
      ? t('dashboard.learningPaths.status.completed', 'Completado')
      : course.status

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canOpen || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onOpen()
  }

  return (
    <article
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : -1}
      onClick={canOpen ? onOpen : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={(event) => {
        onPreview(event.currentTarget, buildCoursePreviewContent(course, item, learningPathTitle, t))
      }}
      onMouseLeave={onPreviewEnd}
      onFocus={(event) => {
        onPreview(event.currentTarget, buildCoursePreviewContent(course, item, learningPathTitle, t))
      }}
      onBlur={onPreviewEnd}
      className={`group flex-none snap-start outline-none ${
        canOpen ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
      aria-disabled={!canOpen}
      style={{
        opacity: isLocked ? 0.56 : 1,
        width: 'clamp(260px, calc((100% - 96px) / 5), 340px)',
      }}
    >
      <div
        className="relative aspect-video overflow-hidden rounded-md border"
        style={{
          backgroundColor: `${orgColors.textMuted}14`,
          borderColor: orgColors.border,
        }}
      >
        <Image
          src={course.thumbnail || '/images/course-placeholder.png'}
          alt={course.title}
          fill
          className={`object-cover ${isLocked ? 'grayscale' : ''} ${
            disableHeavyEffects ? '' : 'transition-transform duration-300 group-hover:scale-[1.03]'
          }`}
          sizes="(max-width: 768px) 320px, 410px"
        />

        {isLocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700">
              <Lock className="h-5 w-5" />
            </span>
          </div>
        ) : null}

        <span
          className="absolute left-2 top-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold shadow-sm"
          style={{
            backgroundColor: orgColors.cardBg,
            color: orgColors.text,
          }}
        >
          {item.position}
        </span>

        {isCompleted ? (
          <span
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
            style={{
              backgroundColor: orgColors.cardBg,
              color: orgColors.iconColor,
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <h4
        className="mt-3 line-clamp-3 min-h-[60px] text-[15px] font-bold leading-tight transition-colors group-hover:underline md:text-base"
        style={{ color: isLocked ? orgColors.textSecondary : orgColors.text }}
      >
        {course.title}
      </h4>

      <p className="mt-1 truncate text-xs" style={{ color: orgColors.textSecondary }}>
        {course.instructor || learningPathTitle}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-bold tabular-nums" style={{ color: orgColors.iconColor }}>
          {Math.round(progress)}%
        </span>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: `${orgColors.textMuted}24` }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: orgColors.iconColor }}
          />
        </div>
      </div>

      <div className="mt-2 flex min-h-6 items-center justify-between gap-2">
        <p className="truncate text-xs font-medium" style={{ color: isLocked ? orgColors.textMuted : orgColors.textSecondary }}>
          {statusLabel}
        </p>
        {course.has_certificate && isCompleted && onCertificateClick ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCertificateClick()
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:scale-105"
            style={{
              backgroundColor: `${orgColors.iconColor}18`,
              color: orgColors.iconColor,
            }}
            aria-label={t('dashboard.learningPaths.viewCertificate', 'Ver certificado')}
          >
            <Award className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function LearningPathView({
  learningPaths,
  assignedCourses,
  orgColors,
  orgSlug,
  onOpenCourse,
  onCourseClick,
  onCertificateClick,
  disableHeavyEffects = false,
  t,
}: LearningPathViewProps) {
  const [introByPath, setIntroByPath] = useState<Record<string, IntroVideoState>>({})
  const [hoverCard, setHoverCard] = useState<InfoHoverCardState | null>(null)
  const [visibleItemsByPath, setVisibleItemsByPath] = useState<Record<string, number>>({})
  const scrollerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const hoverHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewCacheRef = useRef(new Map<string, Pick<InfoHoverCardContent, 'description' | 'points' | 'source' | 'model'>>())
  const previewRequestRef = useRef(new Set<string>())

  const assignedCoursesById = useMemo(() => {
    const map = new Map<string, AssignedCourse>()
    for (const course of assignedCourses) {
      map.set(course.course_id, course)
    }
    return map
  }, [assignedCourses])

  const learningPathIdKey = useMemo(
    () => learningPaths.map((path) => path.id).join('|'),
    [learningPaths],
  )

  const clearHoverHideTimeout = useCallback(() => {
    if (!hoverHideTimeoutRef.current) return
    clearTimeout(hoverHideTimeoutRef.current)
    hoverHideTimeoutRef.current = null
  }, [])

  const requestPreviewAnalysis = useCallback(
    async (content: InfoHoverCardContent) => {
      const cached = previewCacheRef.current.get(content.key)
      if (cached) {
        setHoverCard((current) =>
          current?.key === content.key
            ? {
                ...current,
                ...cached,
                loading: false,
              }
            : current,
        )
        return
      }

      if (!orgSlug || previewRequestRef.current.has(content.key)) return
      previewRequestRef.current.add(content.key)

      try {
        const locale =
          typeof document !== 'undefined'
            ? document.documentElement.lang || navigator.language
            : undefined
        const response = await fetch(`/api/${encodeURIComponent(orgSlug)}/business-user/learning-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            kind: content.kind,
            targetId: content.targetId,
            locale,
          }),
        })
        const data = (await response.json()) as GeminiPreviewResponse

        if (!response.ok || !data.success || !data.description || !Array.isArray(data.points)) {
          throw new Error('Invalid preview response')
        }

        const analysis = {
          description: data.description,
          points: data.points.slice(0, 3),
          source: data.source,
          model: data.model,
        }

        previewCacheRef.current.set(content.key, analysis)
        setHoverCard((current) =>
          current?.key === content.key
            ? {
                ...current,
                ...analysis,
                loading: false,
              }
            : current,
        )
      } catch {
        setHoverCard((current) =>
          current?.key === content.key
            ? {
                ...current,
                description: t(
                  'dashboard.learningPaths.previewUnavailable',
                  'No se pudo generar el analisis con Gemini en este momento.',
                ),
                points: [],
                loading: false,
                source: 'fallback',
              }
            : current,
        )
      } finally {
        previewRequestRef.current.delete(content.key)
      }
    },
    [orgSlug, t],
  )

  const showPreview = useCallback(
    (anchor: HTMLElement, content: InfoHoverCardContent) => {
      clearHoverHideTimeout()
      const cached = previewCacheRef.current.get(content.key)
      setHoverCard({
        ...content,
        ...(cached ? { ...cached, loading: false } : null),
        rect: anchor.getBoundingClientRect(),
      })

      if (!cached) {
        void requestPreviewAnalysis(content)
      }
    },
    [clearHoverHideTimeout, requestPreviewAnalysis],
  )

  const scheduleHidePreview = useCallback(() => {
    clearHoverHideTimeout()
    hoverHideTimeoutRef.current = setTimeout(() => {
      setHoverCard(null)
      hoverHideTimeoutRef.current = null
    }, 120)
  }, [clearHoverHideTimeout])

  useEffect(() => clearHoverHideTimeout, [clearHoverHideTimeout])

  useEffect(() => {
    setVisibleItemsByPath((current) => {
      const next: Record<string, number> = {}

      for (const learningPath of learningPaths) {
        next[learningPath.id] = Math.min(
          current[learningPath.id] ?? INITIAL_VISIBLE_PATH_ITEMS,
          learningPath.items.length,
        )
      }

      return next
    })
  }, [learningPaths])

  useEffect(() => {
    if (!orgSlug || !learningPathIdKey) {
      setIntroByPath({})
      return
    }

    const pathIds = learningPathIdKey.split('|').filter(Boolean)
    let cancelled = false

    setIntroByPath((current) => {
      const next: Record<string, IntroVideoState> = {}

      for (const pathId of pathIds) {
        next[pathId] = {
          ...(current[pathId] ?? getIntroFallback(true)),
          loading: true,
          showPlayer: false,
        }
      }

      return next
    })

    async function loadIntroVideos() {
      const entries = await Promise.all(
        pathIds.map(async (pathId): Promise<[string, IntroVideoState]> => {
          try {
            const response = await fetch(
              `/api/${encodeURIComponent(orgSlug)}/business-user/lp/${encodeURIComponent(pathId)}/intro-video`,
              { cache: 'no-store' },
            )
            const data = (await response.json()) as IntroVideoResponse

            if (!response.ok || data.success === false) {
              return [pathId, getIntroFallback(false)]
            }

            return [
              pathId,
              {
                introVideoUrl: data.introVideoUrl ?? null,
                watched: Boolean(data.watched),
                loading: false,
                showPlayer: false,
              },
            ]
          } catch {
            return [pathId, getIntroFallback(false)]
          }
        }),
      )

      if (cancelled) return

      setIntroByPath((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }))
    }

    void loadIntroVideos()

    return () => {
      cancelled = true
    }
  }, [orgSlug, learningPathIdKey])

  const scrollPath = useCallback((pathId: string, direction: 'left' | 'right') => {
    const scroller = scrollerRefs.current[pathId]
    if (!scroller) return

    scroller.scrollBy({
      left: direction === 'right' ? 860 : -860,
      behavior: 'smooth',
    })
  }, [])

  const openTour = useCallback((pathId: string) => {
    setIntroByPath((current) => {
      const intro = current[pathId]
      if (!intro?.introVideoUrl) return current

      return {
        ...current,
        [pathId]: {
          ...intro,
          showPlayer: true,
        },
      }
    })
  }, [])

  const showMorePathItems = useCallback((pathId: string, totalItems: number) => {
    setVisibleItemsByPath((current) => ({
      ...current,
      [pathId]: Math.min(
        (current[pathId] ?? INITIAL_VISIBLE_PATH_ITEMS) + PATH_ITEMS_INCREMENT,
        totalItems,
      ),
    }))
  }, [])

  const completeTour = useCallback(
    (pathId: string) => {
      const shouldMarkWatched = Boolean(introByPath[pathId]?.introVideoUrl && !introByPath[pathId]?.watched)

      setIntroByPath((current) => {
        const intro = current[pathId]
        if (!intro) return current

        return {
          ...current,
          [pathId]: {
            ...intro,
            watched: true,
            showPlayer: false,
          },
        }
      })

      if (!shouldMarkWatched || !orgSlug) return

      void fetch(
        `/api/${encodeURIComponent(orgSlug)}/business-user/lp/${encodeURIComponent(pathId)}/intro-video`,
        { method: 'POST' },
      )
    },
    [introByPath, orgSlug],
  )

  if (learningPaths.length === 0) {
    return null
  }

  return (
    <div className="space-y-12">
      {learningPaths.map((learningPath, pathIndex) => {
        const intro = introByPath[learningPath.id] ?? getIntroFallback(Boolean(orgSlug))
        const hasTour = Boolean(intro.introVideoUrl)
        const isTourDisabled = intro.loading || !hasTour
        const completedSummary = `${learningPath.completedItemsCount} ${t('dashboard.learningPaths.of', 'de')} ${learningPath.totalItemsCount} ${t('dashboard.learningPaths.completedCoursesSuffix', 'cursos completados')}`
        const visibleItemCount = visibleItemsByPath[learningPath.id] ?? Math.min(INITIAL_VISIBLE_PATH_ITEMS, learningPath.items.length)
        const visibleItems = learningPath.items.slice(0, visibleItemCount)
        const hasHiddenItems = visibleItemCount < learningPath.items.length

        return (
          <motion.section
            key={learningPath.id}
            id={pathIndex === 0 ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathSection : undefined}
            initial={disableHeavyEffects ? false : { opacity: 0, y: 12 }}
            animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
            transition={disableHeavyEffects ? undefined : { delay: pathIndex * 0.05 }}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2
                  className="inline-block max-w-full cursor-help truncate text-2xl font-bold leading-tight outline-none"
                  style={{ color: orgColors.text }}
                  tabIndex={0}
                  onMouseEnter={(event) => {
                    showPreview(event.currentTarget, buildLearningPathPreviewContent(learningPath, t))
                  }}
                  onMouseLeave={scheduleHidePreview}
                  onFocus={(event) => {
                    showPreview(event.currentTarget, buildLearningPathPreviewContent(learningPath, t))
                  }}
                  onBlur={scheduleHidePreview}
                >
                  {learningPath.title}
                </h2>
                <p className="mt-1 text-sm" style={{ color: orgColors.textSecondary }}>
                  {completedSummary}
                </p>
              </div>

              <button
                type="button"
                id={pathIndex === 0 ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathIntroVideo : undefined}
                disabled={isTourDisabled}
                onClick={() => openTour(learningPath.id)}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  backgroundColor: isTourDisabled ? `${orgColors.textMuted}12` : orgColors.cardBg,
                  borderColor: isTourDisabled ? orgColors.border : orgColors.iconColor,
                  color: isTourDisabled ? orgColors.textMuted : orgColors.text,
                }}
                aria-label={
                  hasTour
                    ? t('dashboard.learningPaths.viewTour', 'Video introductorio')
                    : t('dashboard.learningPaths.tourUnavailable', 'Video no disponible')
                }
              >
                {intro.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {intro.loading
                  ? t('dashboard.learningPaths.tourLoading', 'Cargando video')
                  : t('dashboard.learningPaths.viewTour', 'Video introductorio')}
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => scrollPath(learningPath.id, 'left')}
                className="absolute left-0 top-[90px] z-10 hidden h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border shadow-lg transition hover:scale-105 md:flex xl:top-[116px]"
                style={{
                  backgroundColor: orgColors.cardBg,
                  borderColor: orgColors.border,
                  color: orgColors.text,
                }}
                aria-label={t('dashboard.learningPaths.previousCourses', 'Cursos anteriores')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div
                ref={(node) => {
                  scrollerRefs.current[learningPath.id] = node
                }}
                className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {visibleItems.length > 0 ? (
                  visibleItems.map((item) => {
                    const assignedCourse = assignedCoursesById.get(item.courseId)
                    const course = assignedCourse ?? buildCourseFromPathItem(item, learningPath, t)
                    const openCourse = () => {
                      if (assignedCourse) {
                        onCourseClick(course)
                        return
                      }

                      onOpenCourse(item.slug)
                    }

                    return (
                      <LearningPathCourseTile
                        key={`${learningPath.id}-${item.courseId}-${item.position}`}
                        course={course}
                        item={item}
                        learningPathTitle={learningPath.title}
                        orgColors={orgColors}
                        onOpen={openCourse}
                        onCertificateClick={
                          course.progress === 100 && course.has_certificate && onCertificateClick
                            ? () => onCertificateClick(course)
                            : undefined
                        }
                        onPreview={showPreview}
                        onPreviewEnd={scheduleHidePreview}
                        t={t}
                        disableHeavyEffects={disableHeavyEffects}
                      />
                    )
                  })
                ) : (
                  <div
                    className="w-full rounded-md border px-4 py-5 text-sm"
                    style={{
                      backgroundColor: orgColors.cardBg,
                      borderColor: orgColors.border,
                      color: orgColors.textSecondary,
                    }}
                  >
                    {t('dashboard.learningPaths.emptyPath', 'Esta ruta aun no tiene cursos asignados.')}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => scrollPath(learningPath.id, 'right')}
                className="absolute right-0 top-[90px] z-10 hidden h-12 w-12 translate-x-1/2 items-center justify-center rounded-full border shadow-lg transition hover:scale-105 md:flex xl:top-[116px]"
                style={{
                  backgroundColor: orgColors.cardBg,
                  borderColor: orgColors.border,
                  color: orgColors.text,
                }}
                aria-label={t('dashboard.learningPaths.nextCourses', 'Mas cursos')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {hasHiddenItems ? (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => showMorePathItems(learningPath.id, learningPath.items.length)}
                  className="rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: orgColors.cardBg,
                    borderColor: orgColors.border,
                    color: orgColors.text,
                  }}
                >
                  {t('dashboard.learningPaths.showMoreCourses', 'Ver mas cursos')}
                </button>
              </div>
            ) : null}

            {intro.showPlayer && intro.introVideoUrl ? (
              <OnboardingVideoPlayer
                videos={[intro.introVideoUrl]}
                onComplete={() => completeTour(learningPath.id)}
              />
            ) : null}
          </motion.section>
        )
      })}

      {hoverCard ? (
        <InfoHoverCard
          card={hoverCard}
          orgColors={orgColors}
          onMouseEnter={clearHoverHideTimeout}
          onMouseLeave={scheduleHidePreview}
          t={t}
        />
      ) : null}
    </div>
  )
}
