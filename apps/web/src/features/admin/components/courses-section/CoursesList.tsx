'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Trash2 } from 'lucide-react'
import type { Course, AssignedCourse, UserAssignment } from './courses-section.types'
import { colors } from './courses-section.types'

// ---- Course Card for Org tab ----
function CourseCard({ course, date, onRemove }: { course: Course; date: string; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-[2rem] overflow-hidden border transition-all hover:shadow-2xl hover:shadow-accent/5 flex flex-col h-full"
      style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="aspect-video relative overflow-hidden bg-black/20">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10"><BookOpen className="w-10 h-10" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10">{course.level}</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{course.category}</p>
        <h5 className="text-base font-bold text-white leading-tight line-clamp-2 mb-4">{course.title}</h5>

        <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: colors.grayMedium }} />
              <span className="text-[11px] font-medium" style={{ color: colors.grayMedium }}>Adquirido: {new Date(date).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all opacity-40 hover:opacity-100"
          >
            Revocar Acceso
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ---- Org Courses Grid ----
interface OrgCoursesGridProps {
  activeHierarchy: AssignedCourse[]
  onRemove: (courseId: string) => void
}

export function OrgCoursesGrid({ activeHierarchy, onRemove }: OrgCoursesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeHierarchy.length === 0 ? (
        <div className="col-span-full py-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <BookOpen className="w-12 h-12 mb-4 opacity-10" />
          <p className="text-sm text-center px-10" style={{ color: colors.grayMedium }}>No hay cursos adquiridos para toda la organización.<br />Abre el catálogo para empezar.</p>
        </div>
      ) : (
        activeHierarchy.map(ah => (
          <CourseCard key={ah.id} course={ah.courses} date={ah.assigned_at} onRemove={() => onRemove(ah.course_id)} />
        ))
      )}
    </div>
  )
}

// ---- User Assignments Table ----
interface UserAssignmentsTableProps {
  activeUserAssignments: UserAssignment[]
  onRemove: (assignmentId: string) => void
}

export function UserAssignmentsTable({ activeUserAssignments, onRemove }: UserAssignmentsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border" style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}>
      <table className="w-full text-left">
        <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <tr>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.grayMedium }}>Usuario</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.grayMedium }}>Curso</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: colors.grayMedium }}>Progreso</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right" style={{ color: colors.grayMedium }}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {activeUserAssignments.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-20 text-center text-sm" style={{ color: colors.grayMedium }}>No hay asignaciones individuales registradas.</td>
            </tr>
          ) : (
            activeUserAssignments.map(ua => (
              <tr key={ua.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                      {ua.users.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{ua.users.display_name || `${ua.users.first_name || ''} ${ua.users.last_name || ''}`.trim()}</p>
                      <p className="text-[10px]" style={{ color: colors.grayMedium }}>{ua.users.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-white line-clamp-1">{ua.courses.title}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${ua.completion_percentage}%`, backgroundColor: colors.accent }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: colors.accent }}>{ua.completion_percentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onRemove(ua.id)}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 opacity-40 hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
