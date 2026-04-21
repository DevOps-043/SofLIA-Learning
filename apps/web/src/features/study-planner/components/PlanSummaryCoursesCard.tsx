'use client'

import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import type { CourseInfo } from '../types/user-context.types'

interface PlanSummaryCoursesCardProps {
  courses: CourseInfo[]
}

export function PlanSummaryCoursesCard({
  courses,
}: PlanSummaryCoursesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white">
          Cursos Incluidos ({courses.length})
        </h3>
      </div>
      <div className="space-y-2">
        {courses.slice(0, 5).map((course, index) => (
          <div
            key={course.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700/50 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{index + 1}.</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">{course.title}</span>
            </div>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-300">
              {course.level}
            </span>
          </div>
        ))}
        {courses.length > 5 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
            +{courses.length - 5} cursos mas
          </p>
        )}
      </div>
    </motion.div>
  )
}
