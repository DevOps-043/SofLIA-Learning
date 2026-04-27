'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  EyeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import { useAdminPendingCourses } from '../hooks/useAdminPendingCourses'
import { useAdminTheme } from '../hooks/useAdminTheme'
import { ConfirmationModal } from './ConfirmationModal'
import {
  AdminButton,
  AdminIconButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
  AdminTabs,
  AdminToolbar,
} from './ui'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24 } },
}

function CourseThumbnail({ thumbnailUrl, title }: { thumbnailUrl?: string; title: string }) {
  const theme = useAdminTheme()

  if (!thumbnailUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: theme.surfaceSubtle }}>
        <ClipboardDocumentCheckIcon className="h-12 w-12" style={{ color: theme.textMuted }} />
      </div>
    )
  }

  return <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
}

interface AdminPendingCoursesPageProps {
  basePath?: string
}

export function AdminPendingCoursesPage({ basePath = '/admin/courses/pending' }: AdminPendingCoursesPageProps) {
  const router = useRouter()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminTheme()
  const { courses, isLoading, error, approveCourse, rejectCourse, deleteCourse } = useAdminPendingCourses()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending')
  const [courseToApprove, setCourseToApprove] = useState<string | null>(null)
  const [courseToReject, setCourseToReject] = useState<string | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredCourses = courses.filter((course) =>
    (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    course.approval_status === activeTab,
  )
  const pendingCount = courses.filter((course) => course.approval_status === 'pending').length
  const rejectedCount = courses.filter((course) => course.approval_status === 'rejected').length
  const updateCount = courses.filter((course) => course.is_update).length
  const newCount = courses.length - updateCount

  const handleApprove = async () => {
    if (!courseToApprove) return

    const success = await approveCourse(courseToApprove, '')
    if (!success) {
      setActionError(t('pendingCourses.errorApprove'))
    }
    setCourseToApprove(null)
  }

  const handleReject = async () => {
    if (!courseToReject) return

    const success = await rejectCourse(courseToReject, t('pendingCourses.defaultRejectReason'))
    if (!success) {
      setActionError(t('pendingCourses.errorReject'))
    }
    setCourseToReject(null)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return

    const success = await deleteCourse(courseToDelete)
    if (!success) {
      setActionError(t('pendingCourses.errorDelete'))
    }
    setCourseToDelete(null)
  }

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="content">
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-transparent" style={{ borderBottomColor: theme.action }} />
            <p className="text-sm" style={{ color: theme.textMuted }}>{t('pendingCourses.loading')}</p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="content">
        <AdminSurface className="p-6 text-center">
          <p className="text-sm" style={{ color: theme.danger }}>{t('pendingCourses.errorPrefix', { error })}</p>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="content">
      <div className="space-y-7">
        <AdminSectionHeader
          size="page"
          icon={ClipboardDocumentCheckIcon}
          kicker={t('navigation.reviews')}
          title={t('pendingCourses.title')}
          description={t('pendingCourses.subtitle')}
        />

        {actionError ? (
          <AdminSurface className="flex items-center justify-between gap-4 p-4" style={{ backgroundColor: theme.dangerSurface }}>
            <span className="text-sm font-medium" style={{ color: theme.danger }}>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="rounded-lg p-1 transition hover:opacity-80"
              style={{ color: theme.danger }}
              aria-label={tc('actions.close')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </AdminSurface>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard label={t('pendingCourses.metrics.pending')} value={pendingCount} icon={ClockIcon} tone="warning" />
          <AdminMetricCard label={t('pendingCourses.metrics.rejected')} value={rejectedCount} icon={XMarkIcon} tone="danger" />
          <AdminMetricCard label={t('pendingCourses.metrics.updates')} value={updateCount} icon={ClipboardDocumentCheckIcon} tone="primary" />
          <AdminMetricCard label={t('pendingCourses.metrics.new')} value={newCount} icon={CheckCircleIcon} tone="info" />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AdminTabs
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { value: 'pending', label: t('pendingCourses.tabPending'), icon: ClockIcon },
              { value: 'rejected', label: t('pendingCourses.tabRejected'), icon: XMarkIcon },
            ]}
          />
        </div>

        <AdminToolbar>
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
            <AdminInput
              type="text"
              placeholder={t('pendingCourses.searchPlaceholder')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
        </AdminToolbar>

        {filteredCourses.length === 0 ? (
          <AdminSurface className="border-dashed p-10 text-center">
            <InboxIcon className="mx-auto mb-4 h-12 w-12" style={{ color: theme.textMuted }} />
            <h3 className="text-lg font-bold" style={{ color: theme.text }}>
              {activeTab === 'pending' ? t('pendingCourses.emptyPending') : t('pendingCourses.emptyRejected')}
            </h3>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {activeTab === 'pending' ? t('pendingCourses.emptyPendingDesc') : t('pendingCourses.emptyRejectedDesc')}
            </p>
          </AdminSurface>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredCourses.map((course) => (
              <motion.div key={course.id} variants={itemVariants}>
                <AdminSurface className="overflow-hidden" interactive>
                  <div className="relative h-44">
                    <CourseThumbnail thumbnailUrl={course.thumbnail_url} title={course.title} />
                    <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                      <AdminStatusBadge tone={course.approval_status === 'rejected' ? 'danger' : 'warning'}>
                        {course.approval_status === 'rejected' ? t('pendingCourses.statusRejected') : t('pendingCourses.statusPending')}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone={course.is_update ? 'primary' : 'info'}>
                        {course.is_update ? t('pendingCourses.statusUpdate') : t('pendingCourses.statusNew')}
                      </AdminStatusBadge>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-2 line-clamp-1 text-lg font-bold" style={{ color: theme.text }}>
                      {course.title}
                    </h3>
                    <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                      <UserCircleIcon className="h-4 w-4" />
                      <span className="truncate">{course.instructor_name}</span>
                    </div>

                    <div className="mb-4 flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: theme.divider, color: theme.textMuted }}>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {new Date(course.created_at).toLocaleDateString()}
                      </span>
                      <span>{course.level}</span>
                    </div>

                    <div className="flex gap-2">
                      <AdminButton
                        className="flex-1"
                        size="sm"
                        icon={CheckCircleIcon}
                        onClick={() => setCourseToApprove(course.id)}
                        title={t('pendingCourses.tooltipApprove')}
                      >
                        {activeTab === 'rejected' ? t('pendingCourses.btnReconsider') : t('pendingCourses.btnApprove')}
                      </AdminButton>
                      <AdminIconButton
                        icon={EyeIcon}
                        label={t('pendingCourses.tooltipDetails')}
                        onClick={() => router.push(`${basePath}/${course.id}`)}
                        tone="primary"
                        size="sm"
                      />
                      {activeTab === 'pending' ? (
                        <AdminIconButton
                          icon={XMarkIcon}
                          label={t('pendingCourses.tooltipReject')}
                          onClick={() => setCourseToReject(course.id)}
                          tone="danger"
                          size="sm"
                        />
                      ) : null}
                      {activeTab === 'rejected' ? (
                        <AdminIconButton
                          icon={TrashIcon}
                          label={t('pendingCourses.tooltipDelete')}
                          onClick={() => setCourseToDelete(course.id)}
                          tone="danger"
                          size="sm"
                        />
                      ) : null}
                    </div>
                  </div>
                </AdminSurface>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {courseToApprove ? (
        <ConfirmationModal
          isOpen={!!courseToApprove}
          onClose={() => setCourseToApprove(null)}
          onConfirm={handleApprove}
          title={t('pendingCourses.approveModal.title')}
          message={t('pendingCourses.approveModal.message')}
          confirmText={t('pendingCourses.approveModal.confirm')}
          type="success"
        />
      ) : null}

      {courseToReject ? (
        <ConfirmationModal
          isOpen={!!courseToReject}
          onClose={() => setCourseToReject(null)}
          onConfirm={handleReject}
          title={t('pendingCourses.rejectModal.title')}
          message={t('pendingCourses.rejectModal.message')}
          confirmText={t('pendingCourses.rejectModal.confirm')}
          type="danger"
        />
      ) : null}

      {courseToDelete ? (
        <ConfirmationModal
          isOpen={!!courseToDelete}
          onClose={() => setCourseToDelete(null)}
          onConfirm={handleDelete}
          title={t('pendingCourses.deleteModal.title')}
          message={t('pendingCourses.deleteModal.message')}
          confirmText={t('pendingCourses.deleteModal.confirm')}
          type="danger"
        />
      ) : null}
    </AdminPageShell>
  )
}
