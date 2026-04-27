'use client'

import { BookOpenIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAdminCourseDetail } from '../hooks/useAdminCourseDetail'
import { useAdminTheme } from '../hooks/useAdminTheme'
import { ConfirmationModal } from './ConfirmationModal'
import { AdminPendingCourseActionBar } from './admin-pending-course-detail/AdminPendingCourseActionBar'
import { AdminPendingCourseDiff } from './admin-pending-course-detail/AdminPendingCourseDiff'
import { AdminPendingCourseHeader } from './admin-pending-course-detail/AdminPendingCourseHeader'
import { AdminPendingCourseLessonContent } from './admin-pending-course-detail/AdminPendingCourseLessonContent'
import type { PendingCourseDetail } from './admin-pending-course-detail/types'
import { AdminButton, AdminPageShell, AdminSectionHeader, AdminSurface } from './ui'

interface AdminPendingCourseDetailPageProps {
  courseId: string
  successRedirectPath?: string
}

export function AdminPendingCourseDetailPage({
  courseId,
  successRedirectPath = '/admin/courses/pending',
}: AdminPendingCourseDetailPageProps) {
  const router = useRouter()
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { course: courseData, isLoading, error, approveCourse, rejectCourse, deleteCourse, reconsiderCourse } = useAdminCourseDetail(courseId)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDiffView, setShowDiffView] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  const course = courseData as PendingCourseDetail | null

  const handleApprove = async () => {
    const success = await approveCourse('')
    if (success) {
      router.push(successRedirectPath)
    } else {
      setActionError(t('pendingCourseDetail.errorApprove'))
    }
    setShowApproveModal(false)
  }

  const handleReject = async () => {
    const success = await rejectCourse(t('pendingCourseDetail.defaultRejectReason'))
    if (success) {
      router.push(successRedirectPath)
    } else {
      setActionError(t('pendingCourseDetail.errorReject'))
    }
    setShowRejectModal(false)
  }

  const handleDelete = async () => {
    const success = await deleteCourse()
    if (success) {
      router.push(successRedirectPath)
    } else {
      setActionError(t('pendingCourseDetail.errorDelete'))
    }
    setShowDeleteModal(false)
  }

  const handleReconsider = async () => {
    const success = await reconsiderCourse()
    if (!success) {
      setActionError(t('pendingCourseDetail.errorReconsider'))
    }
  }

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="content">
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent" style={{ borderBottomColor: theme.action }} />
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="content">
        <AdminSurface className="p-6 text-sm" style={{ color: theme.danger }}>
          {t('pendingCourses.errorPrefix', { error })}
        </AdminSurface>
      </AdminPageShell>
    )
  }

  if (!course) {
    return (
      <AdminPageShell maxWidth="content">
        <AdminSurface className="p-6 text-sm" style={{ color: theme.text }}>
          {t('pendingCourseDetail.notFound')}
        </AdminSurface>
      </AdminPageShell>
    )
  }

  const isRejected = course.approval_status === 'rejected'
  const diff = course.diff || undefined
  const hasDiff = Boolean(diff)

  return (
    <AdminPageShell maxWidth="content">
      <AdminButton
        onClick={() => router.back()}
        icon={ChevronLeftIcon}
        variant="ghost"
        className="mb-6"
      >
        {t('pendingCourseDetail.backToPending')}
      </AdminButton>

      {actionError ? (
        <AdminSurface className="mb-4 flex items-center justify-between gap-4 px-4 py-3 text-sm" style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}>
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="transition hover:opacity-80">x</button>
        </AdminSurface>
      ) : null}

      <AdminPendingCourseHeader course={course} />

      <AdminSectionHeader
        icon={BookOpenIcon}
        title={t('pendingCourseDetail.courseContent')}
        description={hasDiff ? t('pendingCourseDetail.courseContentWithDiff') : undefined}
      />

      {hasDiff && diff ? (
        <>
          <AdminPendingCourseDiff
            diff={diff}
            onToggle={() => setShowDiffView(!showDiffView)}
            showDiffView={showDiffView}
          />
          {!showDiffView ? <AdminPendingCourseLessonContent modules={course.modules} /> : null}
        </>
      ) : (
        <AdminPendingCourseLessonContent modules={course.modules} />
      )}

      <AdminPendingCourseActionBar
        isRejected={isRejected}
        onApprove={() => setShowApproveModal(true)}
        onDelete={() => setShowDeleteModal(true)}
        onReject={() => setShowRejectModal(true)}
        onReconsider={handleReconsider}
      />

      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title={t('pendingCourseDetail.approveModal.title')}
        message={t('pendingCourseDetail.approveModal.message')}
        confirmText={t('pendingCourseDetail.approveModal.confirm')}
        type="success"
      />
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title={t('pendingCourseDetail.rejectModal.title')}
        message={t('pendingCourseDetail.rejectModal.message')}
        confirmText={t('pendingCourseDetail.rejectModal.confirm')}
        type="danger"
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('pendingCourseDetail.deleteModal.title')}
        message={t('pendingCourseDetail.deleteModal.message')}
        confirmText={t('pendingCourseDetail.deleteModal.confirm')}
        type="danger"
      />
    </AdminPageShell>
  )
}
