'use client';

import { ChevronLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminCourseDetail } from '../hooks/useAdminCourseDetail';
import { ConfirmationModal } from './ConfirmationModal';
import { AdminPendingCourseActionBar } from './admin-pending-course-detail/AdminPendingCourseActionBar';
import { AdminPendingCourseDiff } from './admin-pending-course-detail/AdminPendingCourseDiff';
import { AdminPendingCourseHeader } from './admin-pending-course-detail/AdminPendingCourseHeader';
import { AdminPendingCourseLessonContent } from './admin-pending-course-detail/AdminPendingCourseLessonContent';
import type { PendingCourseDetail } from './admin-pending-course-detail/types';

interface AdminPendingCourseDetailPageProps {
  courseId: string;
  successRedirectPath?: string;
}

export function AdminPendingCourseDetailPage({
  courseId,
  successRedirectPath = '/admin/courses/pending',
}: AdminPendingCourseDetailPageProps) {
  const router = useRouter();
  const { t } = useTranslation('admin');
  const { course: courseData, isLoading, error, approveCourse, rejectCourse, deleteCourse, reconsiderCourse } = useAdminCourseDetail(courseId);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiffView, setShowDiffView] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const course = courseData as PendingCourseDetail | null;

  const handleApprove = async () => {
    const success = await approveCourse('');
    if (success) {
      router.push(successRedirectPath);
    } else {
      setActionError(t('pendingCourseDetail.errorApprove'));
    }
    setShowApproveModal(false);
  };

  const handleReject = async () => {
    const success = await rejectCourse('Rechazado desde panel de detalle');
    if (success) {
      router.push(successRedirectPath);
    } else {
      setActionError(t('pendingCourseDetail.errorReject'));
    }
    setShowRejectModal(false);
  };

  const handleDelete = async () => {
    const success = await deleteCourse();
    if (success) {
      router.push(successRedirectPath);
    } else {
      setActionError(t('pendingCourseDetail.errorDelete'));
    }
    setShowDeleteModal(false);
  };

  const handleReconsider = async () => {
    const success = await reconsiderCourse();
    if (!success) {
      setActionError(t('pendingCourseDetail.errorReconsider'));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!course) {
    return <div className="p-8">{t('pendingCourseDetail.notFound')}</div>;
  }

  const isRejected = course.approval_status === 'rejected';
  const diff = course.diff || undefined;
  const hasDiff = Boolean(diff);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        {t('pendingCourseDetail.backToPending')}
      </button>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-4 text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      <AdminPendingCourseHeader course={course} />

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <BookOpenIcon className="h-6 w-6 text-blue-500" />
        {t('pendingCourseDetail.courseContent')}
      </h2>

      {hasDiff && diff && showDiffView ? (
        <AdminPendingCourseDiff
          diff={diff}
          onToggle={() => setShowDiffView(!showDiffView)}
          showDiffView={showDiffView}
        />
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
    </div>
  );
}
