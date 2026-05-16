'use client'

import { motion } from 'framer-motion'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import type { CourseProgress } from './types'

export function StatsCoursePerformanceCard({ courseProgress }: { courseProgress: CourseProgress[] }) {
  return (
    <Card title="Rendimiento por Curso" description="Promedio de progreso y graduación" icon={AcademicCapIcon} iconColor={colors.purple}>
      <div className="mt-4 space-y-6">
        {courseProgress.map((course, index) => (
          <div key={course.id} className="group">
            <div className="mb-2 flex items-end justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <p className="truncate text-sm font-bold text-white">{course.title}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.grayMedium }}>
                  {course.enrolledCount} alumnos · {course.completedCount} graduados
                </p>
              </div>
              <span className="text-sm font-black" style={{ color: colors.accent }}>{course.averageProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.averageProgress}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: index % 2 === 0 ? colors.purple : colors.accent }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
