'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Lock } from 'lucide-react'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { useCourseAccess } from '@/features/courses/hooks/useCourseAccess'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { CourseLearnLoadingState } from './course-learn-shell/CourseLearnLoadingState'
import { CourseLearnWorkspace } from './course-learn-shell/CourseLearnWorkspace'
import { CourseUnavailableState } from './course-learn-shell/CourseUnavailableState'
import { LegacyProgressResolutionState } from './course-learn-shell/LegacyProgressResolutionState'
import { useLegacyProgressResolution } from './course-learn-shell/useLegacyProgressResolution'
import { useCourseLearnShellState } from './course-learn-shell/useCourseLearnShellState'

interface CourseLearnPageShellProps {
  logic: LearnPageLogicResult
}

export function CourseLearnPageShell({ logic }: CourseLearnPageShellProps) {
  const shell = useCourseLearnShellState(logic)
  // Access check runs in parallel with course data loading — no sequential double loader
  const { hasAccess, isLoading: accessLoading, error: accessError } = useCourseAccess(
    logic.slug,
    logic.organizationId,
    Boolean(logic.orgSlug),
  )
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const legacyProgressResolution = useLegacyProgressResolution({
    enabled: !logic.orgSlug && Boolean(user) && logic.ready && !authLoading,
    slug: logic.slug,
  })
  const courseDetailPath = `/courses/${logic.slug}`
  const dashboardPath = logic.orgSlug ? `/${logic.orgSlug}/dashboard` : '/dashboard'
  const isMissingOrganizationContext = !logic.orgSlug

  if (
    isMissingOrganizationContext &&
    (authLoading ||
      legacyProgressResolution.isLoading ||
      (Boolean(user) &&
        !legacyProgressResolution.resolution &&
        !legacyProgressResolution.error))
  ) {
    return <CourseLearnLoadingState logic={logic} />
  }

  if (isMissingOrganizationContext) {
    return (
      <LegacyProgressResolutionState
        logic={logic}
        state={legacyProgressResolution}
      />
    )
  }

  // Single unified loading state while either course data OR access check is pending
  if (!logic.ready || logic.loading || accessLoading || hasAccess === null) {
    return <CourseLearnLoadingState logic={logic} />
  }

  if (!logic.course) {
    return <CourseUnavailableState logic={logic} />
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-carbon-900 p-4">
        <div className="max-w-md w-full bg-carbon-800 rounded-2xl border border-gray-500/30 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Acceso Restringido</h2>
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm text-left">
              {accessError ?? 'No tienes acceso a este curso'}
            </p>
          </div>
          <p className="text-white/60 mb-6">
            Para acceder al contenido de este curso, primero debes adquirirlo o inscribirte en él.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(courseDetailPath)}
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Ver Curso
            </button>
            <button
              onClick={() => {
                if (logic.orgSlug) {
                  router.push(dashboardPath)
                } else if (user?.organization?.slug) {
                  router.push(`/${user.organization.slug}/dashboard`)
                } else {
                  router.push(dashboardPath)
                }
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <CourseLearnWorkspace logic={logic} shell={shell} />
}
