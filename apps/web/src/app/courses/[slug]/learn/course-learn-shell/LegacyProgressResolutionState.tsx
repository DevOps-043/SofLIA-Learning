'use client'

import { Building2, CheckCircle2, Loader2 } from 'lucide-react'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import type { LegacyProgressResolutionState } from './useLegacyProgressResolution'

export function LegacyProgressResolutionState({
  logic,
  state,
}: {
  logic: LearnPageLogicResult
  state: LegacyProgressResolutionState
}) {
  const resolution = state.resolution
  const candidates = resolution?.candidates ?? []
  const legacy = resolution?.legacy ?? null
  const hasCandidates = candidates.length > 0

  const hasLegacyData = Boolean(legacy?.hasLegacyData)

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 dark:bg-gray-900">
      <div className="w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-gray-900 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {logic.t('legacyProgress.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary dark:text-white">
              {logic.t(
                hasCandidates
                  ? hasLegacyData
                    ? 'legacyProgress.titleWithProgress'
                    : 'legacyProgress.title'
                  : 'legacyProgress.noCompaniesTitle',
              )}
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-white/70">
              {logic.t(
                hasCandidates
                  ? hasLegacyData
                    ? 'legacyProgress.descriptionWithProgress'
                    : 'legacyProgress.description'
                  : 'legacyProgress.noCompaniesDescription',
              )}
            </p>
          </div>
        </div>

        {legacy && hasLegacyData ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Metric
              label={logic.t('legacyProgress.metrics.progress')}
              value={`${Math.round(legacy.progressPercentage)}%`}
            />
            <Metric
              label={logic.t('legacyProgress.metrics.notes')}
              value={String(legacy.notesCount)}
            />
            <Metric
              label={logic.t('legacyProgress.metrics.activities')}
              value={String(legacy.activitySubmissionsCount)}
            />
            <Metric
              label={logic.t('legacyProgress.metrics.quizzes')}
              value={String(legacy.quizSubmissionsCount)}
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {candidates.map((candidate) => {
            const isClaimingThis =
              state.claimingOrganizationId === candidate.organizationId

            return (
              <button
                key={candidate.organizationId}
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-left transition-colors hover:border-accent/60 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-accent/10"
                disabled={state.isClaiming}
                onClick={async () => {
                  const redirectPath = await state.selectOrganization(
                    candidate.organizationId,
                  )
                  if (redirectPath) {
                    logic.router.replace(redirectPath)
                  }
                }}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-primary dark:text-white">
                    {candidate.organizationName}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-white/60">
                    {candidate.hasEnrollment
                      ? logic.t('legacyProgress.existingEnrollment', {
                          progress: Math.round(candidate.progressPercentage),
                        })
                      : logic.t('legacyProgress.newEnrollment')}
                  </span>
                </span>
                {isClaimingThis ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                )}
              </button>
            )
          })}
        </div>

        {!hasCandidates ? (
          <div className="mt-6">
            <button
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              onClick={() => logic.router.replace('/auth/select-organization')}
              type="button"
            >
              {logic.t('legacyProgress.backToOrganizationSelector')}
            </button>
          </div>
        ) : null}

        {state.error ? (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {logic.t(`legacyProgress.errors.${state.error}`)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-xs text-gray-500 dark:text-white/60">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary dark:text-white">{value}</p>
    </div>
  )
}
