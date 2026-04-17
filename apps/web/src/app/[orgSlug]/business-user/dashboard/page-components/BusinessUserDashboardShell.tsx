'use client'

import type { CSSProperties } from 'react'
import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { BookOpen, Clock, GraduationCap, Sparkles, TrendingUp, LayoutGrid, List, Route } from 'lucide-react'
import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '../../../../../core/constants/tourTargets'
import { TeamRequiredBanner } from '../../../../../features/business-panel/components/hierarchy/TeamRequiredBanner'
import type { StyleConfig } from '../../../../../features/business-panel/hooks/useOrganizationStyles'
import { OnboardingVideoPlayer } from '../../../../../features/tours/components/OnboardingVideoPlayer'
import { LearningPathCard } from '../components/LearningPathCard'
import { formatBusinessUserDashboardDate } from '../services/business-user-dashboard.service'
import type {
  AssignedCourse,
  AssignedLearningPath,
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
  currentTime: Date
  language: string
  greeting: string
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
  handleCourseClick: (course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => void
  handleLearningPathCourseClick: (slug: string | null | undefined) => void
  showVideoIntro: boolean
  handleVideoComplete: () => void
  introVideos: string[]
  t: (key: string, defaultValue?: string) => string
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
  currentTime,
  language,
  greeting,
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
  handleCourseClick,
  handleLearningPathCourseClick,
  showVideoIntro,
  handleVideoComplete,
  introVideos,
  t,
}: BusinessUserDashboardShellProps) {
  const [courseView, setCourseView] = useState<'grid' | 'list'>('grid')

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
            className="sticky top-0 z-50 w-full backdrop-blur-xl h-16"
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
            className="scroll-mt-28 mb-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-8 group"
            >
              <div
                className="absolute inset-0 z-0 overflow-hidden"
                style={{
                  backgroundColor: orgColors.primary !== '#FFFFFF' ? orgColors.primary : '#0A2540',
                }}
              >
                <Image
                  src="/images/teams-header.png"
                  alt="Learning Panel Background"
                  fill
                  className="object-cover opacity-50"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent pointer-events-none z-0" />
                <div
                  className="absolute inset-0 opacity-[0.1]"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
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
              </div>

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

              <div className="relative z-10">
                <motion.h1
                  className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-3"
                  style={{ color: '#FFFFFF' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {greeting}, <span className="text-white">{user?.first_name || 'Usuario'}</span>
                </motion.h1>

                <motion.p
                  className="text-lg max-w-xl mb-6"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('dashboard.subtitle')}
                </motion.p>

                <motion.div
                  className="flex flex-wrap items-center gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <Clock className="w-4 h-4" />
                    {formatBusinessUserDashboardDate(currentTime, language)}
                  </div>
                </motion.div>
              </div>

              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${orgColors.primary}50, transparent, ${orgColors.primary}30)`,
                  padding: '1px',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                }}
              />
            </motion.div>
          </div>

          <div
            id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statsSection}
            className="scroll-mt-32 relative"
          >
            <section className="mb-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                    <TrendingUp className="w-5 h-5" style={{ color: orgColors.iconColor }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>
                      {t('dashboard.generalStats', 'Tu Progreso')}
                    </h2>
                    <p className="text-sm" style={{ color: orgColors.textSecondary }}>
                      {t('dashboard.keyMetrics', 'Metricas de tu aprendizaje')}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
                    const isCertificates = stat.label === 'Certificados'
                    return (
                      <ModernStatsCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        index={index}
                        onClick={isCertificates && stats.certificates > 0 ? handleCertificatesClick : undefined}
                        isClickable={isCertificates && stats.certificates > 0}
                        styles={userDashboardStyles}
                        id={
                          index === 0
                            ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCourses
                            : index === 3
                              ? BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCertificates
                              : undefined
                        }
                      />
                    )
                  })}
                </Suspense>
              </div>
            </section>
          </div>

          {learningPaths.length > 0 ? (
            <section className="mb-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mb-6 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-xl border p-2"
                    style={{
                      background: `linear-gradient(135deg, ${orgColors.iconColor}25, ${orgColors.iconColor}08)`,
                      borderColor: `${orgColors.iconColor}30`,
                    }}
                  >
                    <Route className="h-5 w-5" style={{ color: orgColors.iconColor }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>
                      {t('dashboard.learningPaths.title', 'Rutas de aprendizaje')}
                    </h2>
                    <p className="text-sm" style={{ color: orgColors.textSecondary }}>
                      {t(
                        'dashboard.learningPaths.subtitle',
                        'Avanza por tus cursos en el orden recomendado'
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {learningPaths.map((learningPath, index) => (
                  <LearningPathCard
                    key={learningPath.id}
                    learningPath={learningPath}
                    index={index}
                    orgColors={orgColors}
                    onOpenCourse={handleLearningPathCourseClick}
                    t={t}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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

              {assignedCourses.length > 0 && (
                <div className="flex items-center p-1 rounded-lg border shrink-0" style={{ backgroundColor: `${orgColors.cardBg}80`, borderColor: orgColors.border }}>
                  <button
                    onClick={() => setCourseView('grid')}
                    className={`p-2.5 sm:p-1.5 rounded-md transition-colors ${courseView === 'grid' ? 'shadow-sm bg-white/20 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" style={{ color: courseView === 'grid' ? orgColors.iconColor : orgColors.textSecondary }} />
                  </button>
                  <button
                    onClick={() => setCourseView('list')}
                    className={`p-2.5 sm:p-1.5 rounded-md transition-colors ${courseView === 'list' ? 'shadow-sm bg-white/20 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <List className="w-5 h-5 sm:w-4 sm:h-4" style={{ color: courseView === 'list' ? orgColors.iconColor : orgColors.textSecondary }} />
                  </button>
                </div>
              )}
            </motion.div>

            {assignedCourses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-12 text-center"
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
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
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
              </motion.div>
            ) : (
              <div className={`grid ${courseView === 'list' ? 'grid-cols-1 gap-3 sm:gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6'}`}>
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
                  {assignedCourses.map((course, index) => (
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
                      viewMode={courseView}
                    />
                  ))}
                </Suspense>
              </div>
            )}
          </section>
        </div>
      </main>

      {showVideoIntro && introVideos.length > 0 && (
        <OnboardingVideoPlayer videos={introVideos} onComplete={handleVideoComplete} />
      )}
    </div>
  )
}
