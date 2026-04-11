'use client'

import { motion } from 'framer-motion'
import { Eye, ListChecks, Users2 } from 'lucide-react'

import { ResponsiveDataTable, type ResponsiveDataTableColumn } from '@/core/layout'
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

  const handleOpenDetails = async (user: (typeof enrolledUsers)[number]) => {
    setSelectedStudent(user)
    setShowStudentDetailsModal(true)
    await loadStudentDetails(user.user_id)
  }

  const columns: ResponsiveDataTableColumn<(typeof enrolledUsers)[number]>[] = [
    {
      id: 'student',
      header: 'Estudiante',
      thClassName:
        'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white',
      tdClassName: 'px-6 py-4',
      mobileHidden: true,
      cell: (user) => (
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
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#0A2540] dark:text-white">
              {user.display_name}
            </div>
            <div className="truncate text-xs text-[#6C757D] dark:text-white/60">
              {user.email || user.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      thClassName:
        'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white',
      tdClassName: 'px-6 py-4',
      mobileLabel: 'Estado',
      mobileOrder: 1,
      cell: (user) => (
        <StatusBadge enrollmentStatus={user.enrollment_status} />
      ),
    },
    {
      id: 'progress',
      header: 'Progreso',
      thClassName:
        'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white',
      tdClassName: 'px-6 py-4',
      mobileLabel: 'Progreso',
      mobileOrder: 2,
      cell: (user) => <ProgressBar progressPercentage={user.progress_percentage} />,
      mobileValue: (user) => `${Math.round(user.progress_percentage)}%`,
    },
    {
      id: 'enrolledAt',
      header: 'Inscrito',
      thClassName:
        'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white',
      tdClassName: 'px-6 py-4 text-sm text-[#6C757D] dark:text-white/70',
      mobileLabel: 'Inscrito',
      mobileOrder: 3,
      cell: (user) => formatDate(user.enrolled_at, false),
    },
    {
      id: 'lastActivity',
      header: 'Ultima Actividad',
      thClassName:
        'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white',
      tdClassName: 'px-6 py-4 text-sm text-[#6C757D] dark:text-white/70',
      mobileLabel: 'Ultima actividad',
      mobileOrder: 4,
      cell: (user) => formatDate(user.last_accessed_at, true),
    },
    {
      id: 'actions',
      header: 'Acciones',
      thClassName:
        'px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white',
      tdClassName: 'px-6 py-4',
      mobileHidden: true,
      cell: (user) => (
        <div className="flex items-center justify-center">
          <DetailsButton onClick={() => void handleOpenDetails(user)} />
        </div>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3]">
          <ListChecks className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">
            Estudiantes Inscritos
          </h2>
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
          <p className="text-center text-sm text-[#6C757D] dark:text-white/60">
            Los estudiantes apareceran aqui cuando se inscriban al curso
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
          <ResponsiveDataTable
            data={enrolledUsers}
            columns={columns}
            keyExtractor={(user) => user.enrollment_id}
            tableClassName="w-full"
            mobileListClassName="p-3"
            renderMobileCard={(user) => (
              <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
                <div className="flex items-start gap-3">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.display_name}
                      className="h-12 w-12 rounded-full border-2 border-[#00D4B3]"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] text-sm font-bold text-white">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0A2540] dark:text-white">
                      {user.display_name}
                    </p>
                    <p className="truncate text-xs text-[#6C757D] dark:text-white/60">
                      {user.email || user.username}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">
                      Estado
                    </span>
                    <StatusBadge enrollmentStatus={user.enrollment_status} />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">
                      Progreso
                    </span>
                    <span className="text-sm font-bold text-[#0A2540] dark:text-white">
                      {Math.round(user.progress_percentage)}%
                    </span>
                  </div>

                  <ProgressBar progressPercentage={user.progress_percentage} compact />

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <MetadataCard
                      label="Inscrito"
                      value={formatDate(user.enrolled_at, false)}
                    />
                    <MetadataCard
                      label="Ultima actividad"
                      value={formatDate(user.last_accessed_at, true)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <DetailsButton fullWidth onClick={() => void handleOpenDetails(user)} />
                </div>
              </div>
            )}
          />
        </div>
      )}
    </motion.div>
  )
}

function StatusBadge({ enrollmentStatus }: { enrollmentStatus: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getCourseManagementEnrollmentStatusTone(
        enrollmentStatus,
      )}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${getCourseManagementEnrollmentStatusDotTone(
          enrollmentStatus,
        )}`}
      />
      {getCourseManagementEnrollmentStatusLabel(enrollmentStatus)}
    </span>
  )
}

function ProgressBar({
  progressPercentage,
  compact = false,
}: {
  progressPercentage: number
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E9ECEF] dark:bg-[#0A0D12]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3]"
        />
      </div>
      {!compact && (
        <span className="min-w-[3rem] text-right text-sm font-bold text-[#0A2540] dark:text-white">
          {Math.round(progressPercentage)}%
        </span>
      )}
    </div>
  )
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#E9ECEF]/50 px-3 py-2 dark:bg-[#0A0D12]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#0A2540] dark:text-white">{value}</p>
    </div>
  )
}

function DetailsButton({
  onClick,
  fullWidth = false,
}: {
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0A2540] to-[#00D4B3] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:from-[#0d2f4d] hover:to-[#00D4B3] hover:shadow-md ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <Eye className="h-3.5 w-3.5" />
      Ver Detalles
    </motion.button>
  )
}

function formatDate(value: string | null | undefined, includeTime: boolean) {
  if (!value) {
    return includeTime ? 'Nunca' : '--'
  }

  return new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
