'use client'

import { useTranslation } from 'react-i18next'
import { PageShell } from '@/core/layout'
import { useLearningPathManagement } from '../hooks'
import { AddWorkshopCard } from './learning-path-management/AddWorkshopCard'
import { AssignOrganizationCard } from './learning-path-management/AssignOrganizationCard'
import { DelegatedUserAssignmentCard } from './learning-path-management/DelegatedUserAssignmentCard'
import { LearningPathConfirmations } from './learning-path-management/LearningPathConfirmations'
import { LearningPathErrorAlert } from './learning-path-management/LearningPathErrorAlert'
import { LearningPathHero } from './learning-path-management/LearningPathHero'
import { LearningPathLoadingState } from './learning-path-management/LearningPathLoadingState'
import { LearningPathMissingState } from './learning-path-management/LearningPathMissingState'
import { MetadataCard } from './learning-path-management/MetadataCard'
import { OrganizationAssignmentsCard } from './learning-path-management/OrganizationAssignmentsCard'
import { SequenceCard } from './learning-path-management/SequenceCard'
import { UserAssignmentsCard } from './learning-path-management/UserAssignmentsCard'

interface LearningPathManagementPageProps {
  learningPathId: string
}

export function LearningPathManagementPage({ learningPathId }: LearningPathManagementPageProps) {
  const { t } = useTranslation('admin')
  const lp = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    t(`learningPathsPage.${key}`, { defaultValue, ...(options || {}) })
  const state = useLearningPathManagement({ learningPathId })

  if (state.loading) return <LearningPathLoadingState lp={lp} />
  if (!state.learningPath) return <LearningPathMissingState error={state.error} lp={lp} />

  return (
    <PageShell spacing="relaxed">
      <section className="space-y-8">
        <LearningPathHero
          activeOrganizationAssignments={state.activeOrganizationAssignments}
          activeUserAssignments={state.activeUserAssignments}
          learningPath={state.learningPath}
          lp={lp}
        />
        <LearningPathErrorAlert error={state.error} />
        <section className="grid gap-8 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <MetadataCard learningPath={state.learningPath} lp={lp} saving={state.saving} setLearningPath={state.setLearningPath} onSave={state.handleMetadataSave} />
            <AddWorkshopCard availableCourses={state.availableCourses} lp={lp} saving={state.saving} selectedCourseId={state.selectedCourseId} setSelectedCourseId={state.setSelectedCourseId} onAddCourse={state.handleAddCourse} />
            <AssignOrganizationCard availableOrganizations={state.availableOrganizations} lp={lp} saving={state.saving} selectedOrganizationId={state.selectedOrganizationId} setSelectedOrganizationId={state.setSelectedOrganizationId} onAssign={state.handleAssignToOrganization} />
            <DelegatedUserAssignmentCard lp={lp} />
          </div>
          <div className="min-w-0 space-y-6">
            <SequenceCard learningPath={state.learningPath} lp={lp} saving={state.saving} setRemoveTargetId={state.setRemoveTargetId} onReorder={state.handleReorder} />
            <OrganizationAssignmentsCard assignments={state.activeOrganizationAssignments} lp={lp} saving={state.saving} setOrganizationAssignmentToRevoke={state.setOrganizationAssignmentToRevoke} />
            <UserAssignmentsCard assignments={state.activeUserAssignments} lp={lp} />
          </div>
        </section>
      </section>
      <LearningPathConfirmations
        lp={lp}
        organizationAssignmentToRevoke={state.organizationAssignmentToRevoke}
        removeTargetId={state.removeTargetId}
        saving={state.saving}
        setOrganizationAssignmentToRevoke={state.setOrganizationAssignmentToRevoke}
        setRemoveTargetId={state.setRemoveTargetId}
        onConfirmRemoveItem={state.handleConfirmedRemoveItem}
        onConfirmRevokeOrganizationAssignment={state.handleConfirmRevokeOrganizationAssignment}
      />
    </PageShell>
  )
}
