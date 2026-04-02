'use client'

import { CheckCircle, Play } from 'lucide-react'
import { StarRating } from '../StarRating'
import { formatCourseDate } from '../../services/course-detail-display.service'
import type { CourseDetailCourse, CourseDetailSummary } from '../../types/course-detail.types'

interface CourseDetailSidebarProps {
  course: CourseDetailCourse
  summary: CourseDetailSummary
  isPurchased: boolean
  isPurchasing: boolean
  onPurchase: () => void
  onGoToLearn: () => void
}

export function CourseDetailSidebar({
  course,
  summary,
  isPurchased,
  isPurchasing,
  onPurchase,
  onGoToLearn,
}: CourseDetailSidebarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 sticky top-6 shadow-sm dark:shadow-none">
      <div className="space-y-6">
        <div>
          {course.price && course.price !== 'MX$0' ? (
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{course.price}</span>
          ) : (
            <span className="text-3xl font-bold text-primary">Gratis</span>
          )}
        </div>

        <div className="space-y-3">
          {isPurchased ? (
            <button onClick={onGoToLearn} className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Ir a Taller
            </button>
          ) : (
            <button onClick={onPurchase} disabled={isPurchasing} className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              {isPurchasing ? 'Procesando...' : 'Adquirir Curso'}
            </button>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm">Acceso de por vida</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm">{summary.totalLessons} lecciones en video</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm">Certificado de finalizacion</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm">Actualizado {formatCourseDate(course.updatedAt)}</span>
          </div>
        </div>

        {((course.rating && course.rating > 0) || (course.review_count && course.review_count > 0)) ? (
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <StarRating
              rating={course.rating || 0}
              size="lg"
              showRatingNumber={!!(course.rating && course.rating > 0)}
              reviewCount={course.review_count}
              className="justify-center"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
