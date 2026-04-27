'use client'

import Link from 'next/link'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Building2,
  Info,
  Layers3,
  Plus,
  Route,
  Save,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLearningPathManagement } from '../hooks'
import { useAdminTheme } from '../hooks/useAdminTheme'
import { ConfirmationModal } from './ConfirmationModal'
import {
  AdminButton,
  AdminFormField,
  AdminIconButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminTextarea,
} from './ui'

interface LearningPathManagementPageProps {
  learningPathId: string
}

function getUserLabel(user: {
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
} | null | undefined) {
  if (!user) {
    return null
  }

  const composedName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()

  return user.display_name || composedName || user.email
}

export function LearningPathManagementPage({
  learningPathId,
}: LearningPathManagementPageProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const lp = (key: string, options?: Record<string, unknown>) =>
    t(`learningPathsPage.${key}`, options)
  const {
    learningPath,
    availableCourses,
    availableOrganizations,
    activeOrganizationAssignments,
    activeUserAssignments,
    selectedCourseId,
    selectedOrganizationId,
    loading,
    saving,
    error,
    removeTargetId,
    organizationAssignmentToRevoke,
    setLearningPath,
    setSelectedCourseId,
    setSelectedOrganizationId,
    setRemoveTargetId,
    setOrganizationAssignmentToRevoke,
    handleMetadataSave,
    handleAddCourse,
    handleReorder,
    handleConfirmedRemoveItem,
    handleAssignToOrganization,
    handleConfirmRevokeOrganizationAssignment,
  } = useLearningPathManagement({ learningPathId })

  if (loading) {
    return (
      <AdminPageShell maxWidth="wide">
        <AdminSurface className="p-8">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: theme.border, borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-semibold" style={{ color: theme.textMuted }}>
              {lp('loading')}
            </p>
          </div>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  if (!learningPath) {
    return (
      <AdminPageShell maxWidth="wide">
        <AdminSurface className="p-8">
          <p className="text-sm font-semibold" style={{ color: theme.danger }}>
            {error || lp('notFound')}
          </p>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  const orderedItems = learningPath.items
    .slice()
    .sort((left, right) => left.position - right.position)

  return (
    <AdminPageShell maxWidth="wide">
      <section className="space-y-6">
        <AdminSurface className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <Link
                href="/admin/learning-paths"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
                style={{ color: theme.action }}
              >
                <ArrowLeft className="h-4 w-4" />
                {lp('backToList')}
              </Link>

              <AdminSectionHeader
                className="mb-0"
                icon={Route}
                kicker={lp('badge')}
                size="page"
                title={learningPath.title}
                description={learningPath.description || lp('noDescriptionYet')}
                actions={
                  <AdminStatusBadge tone={learningPath.is_active ? 'info' : 'neutral'}>
                    {learningPath.is_active ? lp('active') : lp('inactive')}
                  </AdminStatusBadge>
                }
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <AdminStatusBadge tone="neutral">
                  {lp('workshopsCount', { count: learningPath.item_count })}
                </AdminStatusBadge>
                <AdminStatusBadge tone="neutral">
                  {lp('slugValue', { slug: learningPath.slug || lp('autoSlug') })}
                </AdminStatusBadge>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-xl">
              <AdminMetricCard
                icon={BookOpen}
                label={lp('statsWorkshops')}
                value={learningPath.item_count}
                tone="info"
                className="min-h-[104px]"
              />
              <AdminMetricCard
                icon={Building2}
                label={lp('statsOrganizations')}
                value={activeOrganizationAssignments.length}
                tone="primary"
                className="min-h-[104px]"
              />
              <AdminMetricCard
                icon={Users}
                label={lp('statsUsers')}
                value={activeUserAssignments.length}
                tone="neutral"
                className="min-h-[104px]"
              />
            </div>
          </div>
        </AdminSurface>

        {error ? (
          <AdminSurface className="p-4">
            <p className="text-sm font-semibold" style={{ color: theme.danger }}>
              {error}
            </p>
          </AdminSurface>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <AdminSurface className="p-5">
              <AdminSectionHeader
                size="compact"
                title={lp('metadata')}
                description={lp('existingDescription')}
              />

              <div className="space-y-4">
                <AdminFormField label={lp('titleLabel')}>
                  <AdminInput
                    value={learningPath.title}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current ? { ...current, title: event.target.value } : current,
                      )
                    }
                  />
                </AdminFormField>

                <AdminFormField label={lp('slugLabel')}>
                  <AdminInput
                    value={learningPath.slug || ''}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current ? { ...current, slug: event.target.value } : current,
                      )
                    }
                  />
                </AdminFormField>

                <AdminFormField label={lp('descriptionLabel')}>
                  <AdminTextarea
                    rows={5}
                    value={learningPath.description || ''}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      )
                    }
                  />
                </AdminFormField>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <AdminButton
                    className="w-full sm:flex-1"
                    disabled={saving}
                    icon={Save}
                    onClick={() =>
                      void handleMetadataSave({
                        title: learningPath.title,
                        slug: learningPath.slug,
                        description: learningPath.description,
                        is_active: learningPath.is_active,
                      })
                    }
                  >
                    {saving ? lp('saving') : lp('saveMetadata')}
                  </AdminButton>
                  <AdminButton
                    className="w-full sm:w-auto"
                    disabled={saving}
                    onClick={() =>
                      void handleMetadataSave({ is_active: !learningPath.is_active })
                    }
                    variant="secondary"
                  >
                    {learningPath.is_active ? lp('deactivate') : lp('activate')}
                  </AdminButton>
                </div>
              </div>
            </AdminSurface>

            <AdminSurface className="p-5">
              <AdminSectionHeader
                icon={Plus}
                size="compact"
                title={lp('addWorkshop')}
                description={lp('addWorkshopDescription')}
              />
              <div className="space-y-3">
                <AdminSelect
                  className="w-full"
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                >
                  <option value="">{lp('selectWorkshop')}</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </AdminSelect>
                <AdminButton
                  className="w-full"
                  disabled={!selectedCourseId || saving}
                  icon={Plus}
                  onClick={() => void handleAddCourse()}
                  variant="secondary"
                >
                  {saving ? lp('adding') : lp('addToPath')}
                </AdminButton>
              </div>
            </AdminSurface>

            <AdminSurface className="p-5">
              <AdminSectionHeader
                icon={Building2}
                size="compact"
                title={lp('assignOrganizationTitle')}
                description={lp('assignOrganizationDescription')}
              />
              <div className="space-y-3">
                <AdminSelect
                  className="w-full"
                  value={selectedOrganizationId}
                  onChange={(event) => setSelectedOrganizationId(event.target.value)}
                >
                  <option value="">{lp('selectOrganization')}</option>
                  {availableOrganizations.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminButton
                  className="w-full"
                  disabled={!selectedOrganizationId || saving}
                  icon={Building2}
                  onClick={() => void handleAssignToOrganization()}
                >
                  {saving ? lp('assigning') : lp('assignOrganizationButton')}
                </AdminButton>
              </div>
            </AdminSurface>

            <AdminSurface className="p-5">
              <AdminSectionHeader
                icon={UserCheck}
                size="compact"
                title={lp('assignUserDelegatedTitle')}
                description={lp('assignUserDelegatedDescription')}
              />
              <div
                className="rounded-2xl border border-dashed p-4 text-sm leading-6"
                style={{
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  color: theme.textMuted,
                }}
              >
                <div className="mb-2 flex items-center gap-2 font-semibold" style={{ color: theme.text }}>
                  <Info className="h-4 w-4" />
                  {lp('managedByCompany')}
                </div>
                {lp('assignUserDelegatedHint')}
              </div>
            </AdminSurface>
          </div>

          <div className="min-w-0 space-y-6">
            <AdminSurface className="p-5">
              <AdminSectionHeader
                icon={Layers3}
                size="section"
                title={lp('sequenceTitle')}
                description={lp('sequenceDescription')}
              />

              {orderedItems.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed p-8 text-center text-sm"
                  style={{ borderColor: theme.border, color: theme.textMuted }}
                >
                  {lp('emptySequence')}
                </div>
              ) : (
                <div className="space-y-3">
                  {orderedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex min-w-0 flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                      style={{
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                      }}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold"
                          style={{
                            backgroundColor: theme.actionSurface,
                            borderColor: theme.border,
                            color: theme.action,
                          }}
                        >
                          {item.position}
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-base font-bold" style={{ color: theme.text }}>
                            {item.course?.title || lp('untitledCourse')}
                          </p>
                          <p className="mt-1 break-words text-sm" style={{ color: theme.textMuted }}>
                            {item.course?.category || lp('noCategory')}
                            {' / '}
                            {item.course?.level || lp('noLevel')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:shrink-0">
                        <AdminIconButton
                          disabled={index === 0 || saving}
                          icon={ArrowUp}
                          label={lp('moveUp')}
                          onClick={() => void handleReorder(index, index - 1)}
                          tone="neutral"
                        />
                        <AdminIconButton
                          disabled={index === orderedItems.length - 1 || saving}
                          icon={ArrowDown}
                          label={lp('moveDown')}
                          onClick={() => void handleReorder(index, index + 1)}
                          tone="neutral"
                        />
                        <AdminIconButton
                          disabled={saving}
                          icon={Trash2}
                          label={lp('removeWorkshop')}
                          onClick={() => setRemoveTargetId(item.id)}
                          tone="danger"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminSurface>

            <AdminSurface className="p-5">
              <AdminSectionHeader
                icon={Building2}
                size="section"
                title={lp('organizationAssignmentsTitle')}
                description={lp('organizationAssignmentsDescription')}
              />

              {activeOrganizationAssignments.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed p-6 text-sm"
                  style={{ borderColor: theme.border, color: theme.textMuted }}
                >
                  {lp('noOrganizationAssignments')}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrganizationAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex min-w-0 flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                      style={{ borderColor: theme.border }}
                    >
                      <div className="min-w-0">
                        <p className="break-words font-bold" style={{ color: theme.text }}>
                          {assignment.organization_name}
                        </p>
                        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                          {lp('assignedAt', {
                            date: new Date(assignment.assigned_at).toLocaleDateString(),
                          })}
                        </p>
                      </div>

                      <AdminButton
                        disabled={saving}
                        onClick={() => setOrganizationAssignmentToRevoke(assignment)}
                        variant="danger"
                      >
                        {lp('revokeOrganizationAssignment')}
                      </AdminButton>
                    </div>
                  ))}
                </div>
              )}
            </AdminSurface>

            <AdminSurface className="p-5">
              <AdminSectionHeader
                icon={Users}
                size="section"
                title={lp('userAssignmentsTitle')}
                description={lp('userAssignmentsReadonlyDescription')}
              />

              {activeUserAssignments.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed p-6 text-sm"
                  style={{ borderColor: theme.border, color: theme.textMuted }}
                >
                  {lp('noUserAssignments')}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeUserAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex min-w-0 flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                      style={{ borderColor: theme.border }}
                    >
                      <div className="min-w-0">
                        <p className="break-words font-bold" style={{ color: theme.text }}>
                          {getUserLabel(assignment.user) || lp('unnamedUser')}
                        </p>
                        <p className="mt-1 break-words text-sm" style={{ color: theme.textMuted }}>
                          {assignment.organization_name}
                        </p>
                        <p className="text-sm" style={{ color: theme.textMuted }}>
                          {lp('assignedAt', {
                            date: new Date(assignment.assigned_at).toLocaleDateString(),
                          })}
                        </p>
                      </div>

                      <AdminStatusBadge className="justify-center" tone="neutral">
                        {lp('managedByCompany')}
                      </AdminStatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </AdminSurface>
          </div>
        </section>
      </section>

      <ConfirmationModal
        isOpen={Boolean(removeTargetId)}
        onClose={() => setRemoveTargetId(null)}
        onConfirm={() => void handleConfirmedRemoveItem()}
        title={lp('removeTitle')}
        message={lp('removeMessage')}
        confirmText={lp('removeConfirm')}
        type="danger"
        isLoading={saving}
      />

      <ConfirmationModal
        isOpen={Boolean(organizationAssignmentToRevoke)}
        onClose={() => setOrganizationAssignmentToRevoke(null)}
        onConfirm={() => void handleConfirmRevokeOrganizationAssignment()}
        title={lp('revokeOrganizationTitle')}
        message={lp('revokeOrganizationMessage', {
          organization: organizationAssignmentToRevoke?.organization_name || '',
        })}
        confirmText={lp('revokeOrganizationAssignment')}
        type="danger"
        isLoading={saving}
      />
    </AdminPageShell>
  )
}
