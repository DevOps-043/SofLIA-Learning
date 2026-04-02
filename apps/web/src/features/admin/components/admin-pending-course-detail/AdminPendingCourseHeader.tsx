import { ClockIcon } from '@heroicons/react/24/outline';
import { formatCourseDurationHours } from './utils';
import type { PendingCourseDetail } from './types';

interface AdminPendingCourseHeaderProps {
  course: PendingCourseDetail;
}

export function AdminPendingCourseHeader({ course }: AdminPendingCourseHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
          {course.thumbnail_url && <img src={course.thumbnail_url} alt="Portada" className="w-full h-full object-cover" />}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            {course.approval_status === 'rejected' ? (
              <span className="backdrop-blur-md bg-[#EF4444]/20 dark:bg-[#EF4444]/30 text-[#EF4444] dark:text-[#FCA5A5] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#EF4444]/30 dark:border-[#EF4444]/40 uppercase tracking-widest">
                Rechazado
              </span>
            ) : (
              <span className="backdrop-blur-md bg-[#F59E0B]/20 dark:bg-[#F59E0B]/30 text-[#F59E0B] dark:text-[#FCD34D] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#F59E0B]/30 dark:border-[#F59E0B]/40 uppercase tracking-widest">
                Pendiente
              </span>
            )}
            {course.is_update ? (
              <span className="backdrop-blur-md bg-[#3B82F6]/20 dark:bg-[#3B82F6]/30 text-[#3B82F6] dark:text-[#93C5FD] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#3B82F6]/30 dark:border-[#3B82F6]/40 uppercase tracking-widest">
                Actualización
              </span>
            ) : (
              <span className="backdrop-blur-md bg-[#10B981]/20 dark:bg-[#10B981]/30 text-[#10B981] dark:text-[#6EE7B7] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#10B981]/30 dark:border-[#10B981]/40 uppercase tracking-widest">
                Nuevo
              </span>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{course.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              <ClockIcon className="h-4 w-4" />
              {formatCourseDurationHours(course.duration_total_minutes)} horas
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
              Nivel: {course.level}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
              Categoría: {course.category}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3 pt-4 border-t dark:border-gray-700">
            {course.instructor?.profile_picture_url ? (
              <img src={course.instructor.profile_picture_url} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">I</div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {course.instructor?.display_name || 'Instructor'}
              </p>
              <p className="text-xs text-gray-500">
                {course.instructor?.first_name} {course.instructor?.last_name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
