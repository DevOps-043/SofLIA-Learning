import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import {
  getCourseManagementEnrollmentStatusDotTone,
  getCourseManagementEnrollmentStatusLabel,
  getCourseManagementEnrollmentStatusTone,
} from '../../CourseManagementStudentDetails.service'

export function StatusBadge({ enrollmentStatus }: { enrollmentStatus: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getCourseManagementEnrollmentStatusTone(enrollmentStatus)}`}>
      <span className={`h-2 w-2 rounded-full ${getCourseManagementEnrollmentStatusDotTone(enrollmentStatus)}`} />
      {getCourseManagementEnrollmentStatusLabel(enrollmentStatus)}
    </span>
  )
}

export function ProgressBar({
  progressPercentage,
  compact = false,
}: {
  progressPercentage: number
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-carbon-900">
        <motion.div
          animate={{ width: `${progressPercentage}%` }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {!compact && (
        <span className="min-w-[3rem] text-right text-sm font-bold text-gray-900 dark:text-white">
          {Math.round(progressPercentage)}%
        </span>
      )}
    </div>
  )
}

export function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-100 px-3 py-2 dark:bg-carbon-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

export function DetailsButton({
  onClick,
  fullWidth = false,
}: {
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <motion.button
      className={`flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md ${fullWidth ? 'w-full' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Eye className="h-3.5 w-3.5" />
      Ver Detalles
    </motion.button>
  )
}
