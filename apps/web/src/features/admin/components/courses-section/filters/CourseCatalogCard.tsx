'use client'

import { motion } from 'framer-motion'
import { BookOpen, CheckCircle } from 'lucide-react'
import type { AssignedCourse, Course } from '../courses-section.types'
import { colors } from '../courses-section.types'

interface CourseCatalogCardProps {
  course: Course
  hierarchyCourses: AssignedCourse[]
  assigningId: string | null
  onAssign: (courseId: string) => void
}

export function CourseCatalogCard({
  course,
  hierarchyCourses,
  assigningId,
  onAssign,
}: CourseCatalogCardProps) {
  const isAlreadyPurchased = hierarchyCourses.some(hc => hc.course_id === course.id)

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group rounded-3xl overflow-hidden border transition-all flex flex-col"
      style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="aspect-video relative overflow-hidden bg-black/40">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10"><BookOpen className="w-10 h-10" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-white border border-white/10">
            {course.level}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{course.category}</p>
        <h5 className="text-lg font-bold text-white leading-tight mb-6 line-clamp-2">{course.title}</h5>
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
          {isAlreadyPurchased ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Ya adquirido</span>
            </div>
          ) : (
            <button
              disabled={!!assigningId}
              onClick={() => onAssign(course.id)}
              className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.accent, color: colors.primary }}
            >
              {assigningId === course.id ? 'Procesando...' : 'Adquirir ahora'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
