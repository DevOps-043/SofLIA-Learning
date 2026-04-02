'use client';

import { ChevronLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const { course: courseData, isLoading, error, approveCourse, rejectCourse, deleteCourse, reconsiderCourse } = useAdminCourseDetail(courseId);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiffView, setShowDiffView] = useState(true);

  const course = courseData as PendingCourseDetail | null;

  const handleApprove = async () => {
    const success = await approveCourse('');
    if (success) {
      router.push(successRedirectPath);
    } else {
      alert('Error al aprobar');
    }
    setShowApproveModal(false);
  };

  const handleReject = async () => {
    const success = await rejectCourse('Rechazado desde panel de detalle');
    if (success) {
      router.push(successRedirectPath);
    } else {
      alert('Error al rechazar');
    }
    setShowRejectModal(false);
  };

  const handleDelete = async () => {
    const success = await deleteCourse();
    if (success) {
      router.push(successRedirectPath);
    } else {
      alert('Error al eliminar');
    }
    setShowDeleteModal(false);
  };

  const handleReconsider = async () => {
    const success = await reconsiderCourse();
    if (!success) {
      alert('Error al reconsiderar');
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
    return <div className="p-8">Curso no encontrado</div>;
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
        Volver a pendientes
      </button>

      <AdminPendingCourseHeader course={course} />

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <BookOpenIcon className="h-6 w-6 text-blue-500" />
        Contenido del Curso
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
        title="Confirmar Publicación"
        message="¿Estás seguro de publicar este curso? Será visible inmediatamente para los estudiantes."
        confirmText="Sí, Publicar"
        cancelText="Cancelar"
        type="success"
      />
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="Rechazar Curso"
        message="Esta acción no se puede deshacer fácilmente. El curso pasará a estado 'rejected'."
        confirmText="Sí, Rechazar"
        cancelText="Cancelar"
        type="danger"
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar Curso"
        message="¿Estás seguro de que deseas eliminar permanentemente este curso? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
