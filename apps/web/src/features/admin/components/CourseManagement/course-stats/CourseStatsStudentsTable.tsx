'use client'

import { motion } from 'framer-motion'
import { Eye, ListChecks, Users2 } from 'lucide-react'

import {
  getCourseManagementEnrollmentStatusDotTone,
  getCourseManagementEnrollmentStatusLabel,
  getCourseManagementEnrollmentStatusTone,
} from '../CourseManagementStudentDetails.service'
import { useCourseManagementContext } from '../CourseManagementContext'

export function CourseStatsStudentsTable() {
  const {
    state: {
      enrolledUsers,
      loadStudentDetails,
      setSelectedStudent,
      setShowStudentDetailsModal,
    },
  } = useCourseManagementContext()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3]">
          <ListChecks className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Estudiantes Inscritos</h2>
          <p className="text-sm text-[#6C757D] dark:text-white/60">
            {enrolledUsers.length} estudiantes en total
          </p>
        </div>
      </div>

      {enrolledUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E9ECEF] bg-white py-20 dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A2540]/20 dark:to-[#00D4B3]/20">
            <Users2 className="h-10 w-10 text-[#6C757D] dark:text-white/40" />
          </div>
          <p className="mb-2 text-lg font-semibold text-[#0A2540] dark:text-white">
            No hay estudiantes inscritos
          </p>
          <p className="text-sm text-[#6C757D] dark:text-white/60">
            Los estudiantes apareceran aqui cuando se inscriban al curso
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                    Estudiante
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                    Progreso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                    Inscrito
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                    Ultima Actividad
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                {enrolledUsers.map((user) => (
                  <motion.tr
                    key={user.enrollment_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'rgba(0, 212, 179, 0.05)' }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.display_name}
                            className="h-10 w-10 rounded-full border-2 border-[#00D4B3]"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] text-sm font-bold text-white">
                            {user.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-[#0A2540] dark:text-white">
                            {user.display_name}
                          </div>
                          <div className="text-xs text-[#6C757D] dark:text-white/60">
                            {user.email || user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getCourseManagementEnrollmentStatusTone(
                          user.enrollment_status,
                        )}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${getCourseManagementEnrollmentStatusDotTone(
                            user.enrollment_status,
                          )}`}
                        />
                        {getCourseManagementEnrollmentStatusLabel(user.enrollment_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E9ECEF] dark:bg-[#0A0D12]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${user.progress_percentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3]"
                          />
                        </div>
                        <span className="min-w-[3rem] text-right text-sm font-bold text-[#0A2540] dark:text-white">
                          {Math.round(user.progress_percentage)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6C757D] dark:text-white/70">
                      {user.enrolled_at
                        ? new Date(user.enrolled_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6C757D] dark:text-white/70">
                      {user.last_accessed_at
                        ? new Date(user.last_accessed_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <motion.button
                          onClick={async () => {
                            setSelectedStudent(user)
                            setShowStudentDetailsModal(true)
                            await loadStudentDetails(user.user_id)
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0A2540] to-[#00D4B3] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:from-[#0d2f4d] hover:to-[#00D4B3] hover:shadow-md"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver Detalles
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
