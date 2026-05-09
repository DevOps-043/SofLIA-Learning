'use client'

import type { CSSProperties } from 'react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { BookOpen, GraduationCap, Sparkles, TrendingUp, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react'
import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '../../../../../core/constants/tourTargets'
import { TeamRequiredBanner } from '../../../../../features/business-panel/components/hierarchy/TeamRequiredBanner'
import type { StyleConfig } from '../../../../../features/business-panel/hooks/useOrganizationStyles'
import { OnboardingVideoPlayer } from '../../../../../features/tours/components/OnboardingVideoPlayer'
import { useMinuteTicker } from '../../../../../shared/hooks/useMinuteTicker'
import { getBusinessUserDashboardGreeting } from '../services/business-user-dashboard.service'
import type {
  AssignedCourse,
  AssignedLearningPath,
  AssignedLearningPathItem,
  BusinessUserDashboardColors,
  BusinessUserDashboardStatItem,
  Organization,
  OrgRole,
} from '../types'

// next/dynamic handles SSR correctly. React.lazy() is not supported during
// server-side rendering of Client Components in Next.js App Router — it causes
// an "updateDehydratedSuspenseComponent: Cannot read 'call' of undefined"
// hydration mismatch because the lazy module is unavailable during SSR.
const ModernNavbar = dynamic(
  () => import('../components/ModernNavbar').then((m) => ({ default: m.ModernNavbar })),
  { ssr: false }
)
const ModernStatsCard = dynamic(
  () => import('../components/ModernStatsCard').then((m) => ({ default: m.ModernStatsCard })),
  { ssr: false }
)
const CourseCard3D = dynamic(
  () => import('../components/CourseCard3D').then((m) => ({ default: m.CourseCard3D })),
  { ssr: false }
)
const LearningPathView = dynamic(
  () => import('../components/LearningPathView').then((m) => ({ default: m.LearningPathView })),
  { ssr: false }
)

interface CourseListSectionEntry {
  assigned: boolean
  course: AssignedCourse
  isLocked: boolean
  pathTitle?: string
  position?: number
}

interface CourseListSection {
  entries: CourseListSectionEntry[]
  id: string
  summary: string
  title: string
}

function clampCourseProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0
  return Math.max(0, Math.min(100, progress))
}

function getCourseStatusFromProgress(progress: number): AssignedCourse['status'] {
  if (progress >= 100) return 'Completado'
  if (progress > 0) return 'En progreso'
  return 'No iniciado'
}

function formatDashboardText(
  t: BusinessUserDashboardShellProps['t'],
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

function buildCourseFromLearningPathItem(
  item: AssignedLearningPathItem,
  learningPath: AssignedLearningPath,
  t: BusinessUserDashboardShellProps['t'],
): AssignedCourse {
  const progress = clampCourseProgress(item.progress)

  return {
    id: `${learningPath.id}-${item.courseId}`,
    course_id: item.courseId,
    title: item.title || t('dashboard.learningPaths.courseFallback', 'Curso sin titulo'),
    instructor: learningPath.title,
    progress,
    status: getCourseStatusFromProgress(progress),
    thumbnail: item.thumbnail || '/images/course-placeholder.png',
    slug: item.slug ?? '',
    assigned_at: '',
    has_certificate: item.hasCertificate,
  }
}

interface BusinessUserDashboardShellProps {
  orgSlug?: string
  user: {
    first_name?: string
    last_name?: string
    display_name?: string
    username?: string
  } | null
  organization: Organization | null
  orgRole: OrgRole
  userDashboardStyles: StyleConfig | null | undefined
  backgroundStyle: CSSProperties
  cssVariables: CSSProperties
  orgColors: BusinessUserDashboardColors
  displayName: string
  initials: string
  myStats: BusinessUserDashboardStatItem[]
  stats: { certificates: number }
  assignedCourses: AssignedCourse[]
  learningPaths: AssignedLearningPath[]
  restartTour: () => void
  handleProfileClick: () => void
  handleLogout: () => void
  handleCertificatesClick: () => void
  handleAnalyticsClick: () => void
  handleCourseClick: (course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => void
  handleLearningPathCourseClick: (slug: string | null | undefined) => void
  showVideoIntro: boolean
  handleVideoComplete: () => void
  introVideos: string[]
  t: (key: string, defaultValue?: string) => string
  disableHeavyEffects: boolean
}

export function BusinessUserDashboardShell({
  orgSlug,
  user,
  organization,
  orgRole,
  userDashboardStyles,
  backgroundStyle,
  cssVariables,
  orgColors,
  displayName,
  initials,
  myStats,
  stats,
  assignedCourses,
  learningPaths,
  restartTour,
  handleProfileClick,
  handleLogout,
  handleCertificatesClick,
  handleAnalyticsClick,
  handleCourseClick,
  handleLearningPathCourseClick,
  showVideoIntro,
  handleVideoComplete,
  introVideos,
  t,
  disableHeavyEffects,
}: BusinessUserDashboardShellProps) {
  const [courseView, setCourseView] = useState<'grid' | 'list'>('grid')
  const [visibleCourseCount, setVisibleCourseCount] = useState(
    disableHeavyEffects ? 6 : assignedCourses.length
  )
  const [isStatsOpenMobile, setIsStatsOpenMobile] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const coursePathMap = useMemo(() => {
    const map = new Map<string, { pathTitle: string; position: number; isUnlocked: boolean }>()
    for (const path of learningPaths) {
      for (const item of path.items) {
        if (!map.has(item.courseId)) {
          map.set(item.courseId, {
            pathTitle: path.title,
            position: item.position,
            isUnlocked: item.isUnlocked,
          })
        }
      }
    }
    return map
  }, [learningPaths])

  const assignedCourseMap = useMemo(() => {
    const map = new Map<string, AssignedCourse>()
    for (const course of assignedCourses) {
      map.set(course.course_id, course)
    }
    return map
  }, [assignedCourses])

  const learningPathListSections = useMemo<CourseListSection[]>(() => {
    return learningPaths
      .map((learningPath) => {
        const entries = learningPath.items.map((item) => {
          const assignedCourse = assignedCourseMap.get(item.courseId)
          const course = assignedCourse ?? buildCourseFromLearningPathItem(item, learningPath, t)

          return {
            assigned: Boolean(assignedCourse),
            course,
            isLocked: !item.isUnlocked,
            pathTitle: learningPath.title,
            position: item.position,
          }
        })

        return {
          entries,
          id: learningPath.id,
          summary: `${learningPath.completedItemsCount} ${t('dashboard.learningPaths.of', 'de')} ${learningPath.totalItemsCount} ${t('dashboard.learningPaths.completedCoursesSuffix', 'cursos completados')}`,
          title: learningPath.title,
        }
      })
      .filter((section) => section.entries.length > 0)
  }, [assignedCourseMap, learningPaths, t])

  const standaloneCourses = useMemo(() => {
    const learningPathCourseIds = new Set<string>()

    for (const learningPath of learningPaths) {
      for (const item of learningPath.items) {
        learningPathCourseIds.add(item.courseId)
      }
    }

    return assignedCourses.filter((course) => !learningPathCourseIds.has(course.course_id))
  }, [assignedCourses, learningPaths])

  const standaloneListSection = useMemo<CourseListSection | null>(() => {
    if (standaloneCourses.length === 0) return null

    const completed = standaloneCourses.filter((course) => clampCourseProgress(course.progress) >= 100).length

    return {
      entries: standaloneCourses.map((course) => ({
        assigned: true,
        course,
        isLocked: false,
      })),
      id: 'standalone-courses',
      summary: formatDashboardText(
        t,
        'dashboard.learningPaths.standaloneSummary',
        '{{completed}} de {{total}} cursos completados',
        { completed, total: standaloneCourses.length },
      ),
      title: t('dashboard.learningPaths.standaloneTitle', 'Cursos independientes'),
    }
  }, [standaloneCourses, t])

  const groupedListSections = useMemo(() => {
    return standaloneListSection
      ? [...learningPathListSections, standaloneListSection]
      : learningPathListSections
  }, [learningPathListSections, standaloneListSection])

  const displayedCourses = useMemo(() => {
    if (!disableHeavyEffects) {
      return assignedCourses
    }

    return assignedCourses.slice(0, visibleCourseCount)
  }, [assignedCourses, courseView, disableHeavyEffects, visibleCourseCount])

  useEffect(() => {
    if (!disableHeavyEffects) {
      setVisibleCourseCount(assignedCourses.length)
      return
    }

    setVisibleCourseCount(6)
  }, [assignedCourses.length, disableHeavyEffects])

  const showLearningPathCarousel = learningPaths.length > 0 && assignedCourses.length > 0 && courseView === 'grid'

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    console.debug('[business-user-dashboard] initial cards', {
      disableHeavyEffects,
      renderedCards: displayedCourses.length,
      totalCourses: assignedCourses.length,
    })
  }, [assignedCourses.length, disableHeavyEffects, displayedCourses.length])

  return (
    <div
      className="min-h-screen"
      style={{
        ...cssVariables,
        background: backgroundStyle.background || backgroundStyle.backgroundColor || orgColors.sidebarBg,
      }}
    >
      <Suspense
        fallback={
          <nav
            className={`sticky top-0 z-50 w-full h-16 ${disableHeavyEffects ? '' : 'backdrop-blur-xl'}`}
            style={{
              backgroundColor: orgColors.sidebarBg,
              borderBottom: `1px solid ${orgColors.border}`,
            }}
          />
        }
      >
        <ModernNavbar
          organization={organization}
          user={user}
          orgRole={orgRole}
          getDisplayName={() => displayName}
          getInitials={() => initials}
          onProfileClick={handleProfileClick}
          onLogout={handleLogout}
          styles={userDashboardStyles}
          onRestartTour={restartTour}
          disableHeavyEffects={disableHeavyEffects}
          onCertificatesClick={stats.certificates > 0 ? handleCertificatesClick : undefined}
          onAnalyticsClick={handleAnalyticsClick}
          certificatesCount={stats.certificates}
        />
      </Suspense>

      <main className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${orgColors.primary}08 0%, transparent 50%)`,
          }}
        />

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <TeamRequiredBanner orgSlug={orgSlug} />

          <div
            id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.heroSection}
            className="scroll-mt-28 mb-5 md:mb-8"
          >
            <motion.div
              initial={disableHeavyEffects ? false : { opacity: 0, y: -20 }}
              animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
              transition={disableHeavyEffects ? undefined : { duration: 0.6 }}
              className="relative overflow-hidden rounded-xl md:rounded-2xl px-4 pt-4 pb-7 md:px-6 md:pt-5 md:pb-8 lg:px-8 lg:pt-6 lg:pb-10 group"
            >
              <div
                className="absolute inset-0 z-0 overflow-hidden"
                style={{
                  backgroundColor: orgColors.primary !== 'var(--color-bg-light)' ? orgColors.primary : 'var(--color-primary)',
                }}
              >
                <Image
                  src="/images/teams-header.webp"
                  alt="Learning Panel Background"
                  fill
                  className={`object-cover ${disableHeavyEffects ? 'opacity-35' : 'opacity-50'}`}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent pointer-events-none z-0" />
                {!disableHeavyEffects ? (
                  <>
                    <div
                      className="absolute inset-0 opacity-[0.1]"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgb(255 255 255 / 10%) 1px, transparent 1px),
                          linear-gradient(90deg, rgb(255 255 255 / 10%) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                      }}
                    />
                    <div
                      className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px]"
                      style={{ backgroundColor: `${orgColors.accent}20` }}
                    />
                    <div
                      className="absolute right-1/4 bottom-0 w-64 h-64 rounded-full blur-[100px]"
                      style={{ backgroundColor: `${orgColors.primary}15` }}
                    />
                  </>
                ) : null}
              </div>

              {!disableHeavyEffects ? (
                <>
                  <div
                    className="absolute top-6 right-12 w-2 h-2 rounded-full z-10"
                    style={{ backgroundColor: orgColors.accent }}
                  />
                  <div
                    className="absolute bottom-8 right-24 w-1.5 h-1.5 rounded-full z-10 opacity-60"
                    style={{ backgroundColor: orgColors.primary }}
                  />
                  <div
                    className="absolute top-1/2 right-16 w-1 h-1 rounded-full z-10 opacity-40"
                    style={{ backgroundColor: orgColors.primary }}
                  />
                  <div
                    className="absolute bottom-12 right-32 w-3 h-3 rounded-full"
                    style={{ backgroundColor: `${orgColors.primary}40` }}
                  />
                </>
              ) : null}

              <div className="relative z-10">
                <motion.h1
                  className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1.5 md:mb-2 leading-tight"
                  style={{ color: 'var(--color-bg-light)' }}
                  initial={disableHeavyEffects ? false : { opacity: 0, y: 20 }}
                  animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
                  transition={disableHeavyEffects ? undefined : { delay: 0.3 }}
                >
                  <BusinessUserGreeting firstName={user?.first_name} t={t} />
                </motion.h1>

                <motion.p
                  className="text-xs md:text-sm lg:text-base max-w-xl line-clamp-2 md:line-clamp-none"
                  style={{ color: 'rgb(255 255 255 / 80%)' }}
                  initial={disableHeavyEffects ? false : { opacity: 0, y: 20 }}
                  animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
                  transition={disableHeavyEffects ? undefined : { delay: 0.4 }}
                >
                  {t('dashboard.subtitle')}
                </motion.p>
              </div>

              {!disableHeavyEffects ? (
                <div
                  className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.primary}50, transparent, ${orgColors.primary}30)`,
                    padding: '1px',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                  }}
                />
              ) : null}
            </motion.div>
          </div>

          {/* Stats section moved to user dropdown menu */}
          <div
            id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statsSection}
            className="scroll-mt-32 relative hidden"
          >
            <section className="mb-6 md:mb-10">
              <motion.div
                initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
                animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
                transition={disableHeavyEffects ? undefined : { delay: 0.3 }}
                className="flex items-center justify-between mb-4 md:mb-6"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-xl border flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${orgColors.iconColor}25, ${orgColors.iconColor}08)`,
                      borderColor: `${orgColors.iconColor}30`,
                    }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: orgColors.iconColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold" style={{ color: orgColors.text }}>
                      {t('dashboard.generalStats', 'Tu Progreso')}
                    </h2>
                    <p className="text-xs md:text-sm" style={{ color: orgColors.textSecondary }}>
                      {t('dashboard.keyMetrics', 'Metricas de tu aprendizaje')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStatsOpenMobile(!isStatsOpenMobile)}
                  className="md:hidden flex items-center justify-center p-2 rounded-full transition-colors flex-shrink-0 ml-2"
                  style={{ backgroundColor: `${orgColors.iconColor}15`, color: orgColors.iconColor }}
                  aria-label="Toggle statistics"
                >
                  {isStatsOpenMobile ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </motion.div>

              <div className={!isStatsOpenMobile ? 'hidden md:block' : 'block'}>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                <Suspense
                  fallback={
                    <>
                      {myStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl p-5 animate-pulse h-32"
                          style={{
                            backgroundColor: orgColors.cardBg,
                            border: `1px solid ${orgColors.border}`,
                          }}
                        />
                      ))}
                    </>
                  }
                >
                  {myStats.map((stat, index) => {
                    const isCertificates = stat.kind === 'certificates'
                    const isAnalytics = stat.kind === 'analytics'
                    return (
                      <ModernStatsCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        index={index}
                        onClick={
                          isCertificates && stats.certificates > 0
                            ? handleCertificatesClick
                            : isAnalytics
                              ? handleAnalyticsClick
                              : undefined
                        }
                        isClickable={(isCertificates && stats.certificates > 0) || isAnalytics}
                        styles={userDashboardStyles}
                        disableHeavyEffects={disableHeavyEffects}
                        id={
                          index === 0
                            ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCourses
                            : index === 3
                              ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCertificates
                              : isAnalytics
                                ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statAnalytics
                              : undefined
                        }
                      />
                    )
                  })}
                </Suspense>
              </div>
              </div>
            </section>
          </div>


          <section>
            <motion.div
              initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
              animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
              transition={disableHeavyEffects ? undefined : { delay: 0.4 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl border"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.iconColor}25, ${orgColors.iconColor}08)`,
                    borderColor: `${orgColors.iconColor}30`,
                  }}
                >
                  <GraduationCap className="w-5 h-5" style={{ color: orgColors.iconColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>
                    {t('sidebar.courses')}
                  </h2>
                  <p className="text-sm" style={{ color: orgColors.textSecondary }}>
                    {t('dashboard.quickActions.assignCourses.desc', 'Continua donde lo dejaste')}
                  </p>
                </div>
              </div>

              {(assignedCourses.length > 0 || learningPaths.length > 0) && (
                <div
                  id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.courseViewSwitcher}
                  className="flex items-center p-1 rounded-lg border shrink-0"
                  style={{ backgroundColor: `${orgColors.cardBg}80`, borderColor: orgColors.border }}
                >
                  <button
                    id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.courseViewGridButton}
                    onClick={() => setCourseView('grid')}
                    className={`p-2.5 sm:p-1.5 rounded-md transition-colors ${courseView === 'grid' ? 'shadow-sm bg-white/20 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    title="Vista cuadrícula"
                  >
                    <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" style={{ color: courseView === 'grid' ? orgColors.iconColor : orgColors.textSecondary }} />
                  </button>
                  <button
                    onClick={() => setCourseView('list')}
                    className={`p-2.5 sm:p-1.5 rounded-md transition-colors ${courseView === 'list' ? 'shadow-sm bg-white/20 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    title="Vista lista"
                  >
                      <List className="w-5 h-5 sm:w-4 sm:h-4" style={{ color: courseView === 'list' ? orgColors.iconColor : orgColors.textSecondary }} />
                  </button>
                </div>
              )}
            </motion.div>

            {showLearningPathCarousel ? (
              <LearningPathView
                learningPaths={learningPaths}
                assignedCourses={assignedCourses}
                orgColors={orgColors}
                orgSlug={orgSlug ?? ''}
                onOpenCourse={handleLearningPathCourseClick}
                onCourseClick={handleCourseClick}
                onCertificateClick={(course) => handleCourseClick(course, 'certificate')}
                disableHeavyEffects={disableHeavyEffects}
                t={t}
              />
            ) : assignedCourses.length === 0 ? (
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
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${orgColors.primary}15, transparent 60%)`,
                  }}
                />

                <motion.div
                  initial={disableHeavyEffects ? false : { scale: 0.8 }}
                  animate={disableHeavyEffects ? undefined : { scale: 1 }}
                  transition={disableHeavyEffects ? undefined : { delay: 0.2, type: 'spring' }}
                  className="relative z-10"
                >
                  <div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border"
                    style={{
                      backgroundColor: `${orgColors.iconColor}15`,
                      borderColor: `${orgColors.iconColor}30`,
                    }}
                  >
                    <BookOpen className="w-10 h-10" style={{ color: orgColors.iconColor }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: orgColors.text }}>
                    {t('dashboard.emptyCourses.title', 'No tienes cursos asignados aun')}
                  </h3>
                  <p className="max-w-md mx-auto" style={{ color: orgColors.textSecondary }}>
                    {t(
                      'dashboard.emptyCourses.description',
                      'Tu organizacion te asignara cursos proximamente. Mientras tanto, explora lo que tenemos preparado para ti.'
                    )}
                  </p>

                  <div className="absolute top-6 right-6">
                    <Sparkles className="w-5 h-5" style={{ color: `${orgColors.iconColor}50` }} />
                  </div>
                  <div className="absolute bottom-8 left-8">
                    <GraduationCap className="w-6 h-6" style={{ color: `${orgColors.iconColor}50` }} />
                  </div>
                </motion.div>

                {!disableHeavyEffects ? (
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
                ) : null}
              </motion.div>
            ) : courseView === 'list' && groupedListSections.length > 0 ? (
              <div className="space-y-8">
                <Suspense
                  fallback={
                    <div className="space-y-4">
                      {assignedCourses.map((_, index) => (
                        <div
                          key={index}
                          className="rounded-2xl animate-pulse h-20 w-full"
                          style={{
                            backgroundColor: orgColors.cardBg,
                            border: `1px solid ${orgColors.border}`,
                          }}
                        />
                      ))}
                    </div>
                  }
                >
                  {groupedListSections.map((section) => (
                    <div key={section.id} className="space-y-4">
                      <button
                        onClick={() => toggleGroup(section.id)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 rounded-xl outline-none group hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div
                            className="p-1.5 rounded-lg border bg-white/5 border-white/10 shrink-0"
                            style={{ color: orgColors.accent }}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${collapsedGroups[section.id] ? '-rotate-90' : ''}`}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold leading-tight" style={{ color: orgColors.text }}>
                              {section.title}
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: orgColors.textSecondary }}>
                              {section.summary}
                            </p>
                          </div>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-2 hidden sm:block" />
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 shrink-0"
                          style={{ color: orgColors.textSecondary }}
                        >
                          {section.entries.length} {t('dashboard.learningPaths.coursesLabel', 'cursos')}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {!collapsedGroups[section.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 ml-4 md:ml-12 pb-4">
                              {section.entries.map((entry, index) => (
                                <CourseCard3D
                                  key={`${section.id}-${entry.course.course_id}-${entry.position ?? index}`}
                                  course={entry.course}
                                  index={index}
                                  onClick={() => {
                                    if (entry.assigned) {
                                      handleCourseClick(entry.course)
                                      return
                                    }

                                    handleLearningPathCourseClick(entry.course.slug)
                                  }}
                                  onCertificateClick={
                                    entry.course.progress === 100 && entry.course.has_certificate
                                      ? () => handleCourseClick(entry.course, 'certificate')
                                      : undefined
                                  }
                                  styles={userDashboardStyles}
                                  viewMode="list"
                                  learningPathTitle={entry.pathTitle}
                                  learningPathPosition={entry.position}
                                  isLockedInPath={entry.isLocked}
                                  disableHeavyEffects={disableHeavyEffects}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </Suspense>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                <Suspense
                  fallback={
                    <>
                      {assignedCourses.map((_, index) => (
                        <div
                          key={index}
                          className="rounded-2xl animate-pulse h-80"
                          style={{
                            backgroundColor: orgColors.cardBg,
                            border: `1px solid ${orgColors.border}`,
                          }}
                        />
                      ))}
                    </>
                  }
                >
                  {displayedCourses.map((course, index) => {
                    const pathInfo = coursePathMap.get(course.course_id)
                    return (
                      <CourseCard3D
                        key={course.id}
                        course={course}
                        index={index}
                        onClick={() => handleCourseClick(course)}
                        onCertificateClick={
                          course.progress === 100 && course.has_certificate
                            ? () => handleCourseClick(course, 'certificate')
                            : undefined
                        }
                        styles={userDashboardStyles}
                        viewMode="grid"
                        learningPathTitle={pathInfo?.pathTitle}
                        learningPathPosition={pathInfo?.position}
                        isLockedInPath={pathInfo ? !pathInfo.isUnlocked : false}
                        disableHeavyEffects={disableHeavyEffects}
                      />
                    )
                  })}
                </Suspense>
              </div>
            )}
            {disableHeavyEffects && !showLearningPathCarousel && !(courseView === 'list' && groupedListSections.length > 0) && displayedCourses.length < assignedCourses.length ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCourseCount((current) => Math.min(current + 6, assignedCourses.length))}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    borderColor: orgColors.border,
                    backgroundColor: orgColors.cardBg,
                    color: orgColors.text,
                  }}
                >
                  {t('dashboard.actions.loadMoreCourses', 'Ver mas talleres')}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      {showVideoIntro && introVideos.length > 0 && (
        <OnboardingVideoPlayer videos={introVideos} onComplete={handleVideoComplete} />
      )}
    </div>
  )
}

function BusinessUserGreeting({
  firstName,
  t,
}: {
  firstName?: string
  t: (key: string, defaultValue?: string) => string
}) {
  const currentTime = useMinuteTicker()

  return (
    <>
      {getBusinessUserDashboardGreeting(currentTime, t)},{' '}
      <span className="text-white">{firstName || 'Usuario'}</span>
    </>
  )
}
