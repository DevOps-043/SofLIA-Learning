'use client'

import { ArrowRight, BarChart3, Calendar, Clock, FileCheck, Search, Settings, TrendingUp, Users } from 'lucide-react'
import { StarRating } from '../StarRating'
import {
  formatCourseDate,
  formatCourseDuration,
  resolveCourseDifficultyClassName,
  resolveCourseDifficultyText,
} from '../../services/course-detail-display.service'
import type { CourseDetailCourse, CourseDetailSummary } from '../../types/course-detail.types'

interface CourseDetailHeroProps {
  course: CourseDetailCourse
  summary: CourseDetailSummary
}

export function CourseDetailHero({ course, summary }: CourseDetailHeroProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 mb-8 bg-white dark:bg-slate-800 shadow-lg">
      {course.thumbnail ? (
        <div className="relative h-96 bg-gray-200 dark:bg-slate-700">
          <img src={course.thumbnail} alt={course.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent dark:from-slate-900 dark:via-slate-900/50" />

          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-20 left-1/4 w-16 h-16">
              <Search className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="absolute top-32 right-1/4 w-14 h-14">
              <FileCheck className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="absolute top-40 left-1/2 w-12 h-12">
              <ArrowRight className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-32 right-1/3 w-14 h-14">
              <Settings className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-24 right-1/4 w-12 h-12">
              <ArrowRight className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-32 left-1/3 w-16 h-16">
              <TrendingUp className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="absolute top-1/2 left-1/2 w-20 h-20">
              <BarChart3 className="w-full h-full text-cyan-400" strokeWidth={1.5} />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {course.category && (
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold border border-primary/30">
                      {course.category}
                    </span>
                  )}
                  {course.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${resolveCourseDifficultyClassName(course.difficulty)}`}>
                      {resolveCourseDifficultyText(course.difficulty)}
                    </span>
                  )}
                  {summary.totalModules > 0 && (
                    <span className="px-3 py-1 bg-white/20 dark:bg-slate-700/50 text-white dark:text-slate-300 rounded-full text-xs font-semibold border border-white/30 dark:border-slate-600">
                      {summary.totalModules} modulos
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>
                <div className="flex items-center gap-6 flex-wrap">
                  {((course.rating && course.rating > 0) || (course.review_count && course.review_count > 0)) ? (
                    <div className="flex items-center gap-2">
                      <StarRating
                        rating={course.rating || 0}
                        size="md"
                        showRatingNumber={!!(course.rating && course.rating > 0)}
                        reviewCount={course.review_count}
                      />
                      {course.review_count && course.review_count > 0 && (
                        <span className="text-white/80 dark:text-slate-300 text-sm">
                          ({course.review_count} {course.review_count === 1 ? 'resena' : 'resenas'})
                        </span>
                      )}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 text-white/80 dark:text-slate-300">
                    <Users className="w-5 h-5" />
                    <span>{course.student_count?.toLocaleString() || '0'} estudiantes</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 dark:text-slate-300">
                    <Clock className="w-5 h-5" />
                    <span>{formatCourseDuration(course.estimatedDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 dark:text-slate-300">
                    <Calendar className="w-5 h-5" />
                    <span>Actualizado {formatCourseDate(course.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
          <BarChart3 className="w-32 h-32 text-primary/30" />
        </div>
      )}
    </div>
  )
}
