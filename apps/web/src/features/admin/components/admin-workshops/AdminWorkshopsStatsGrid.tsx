'use client'

import { motion } from 'framer-motion'
import {
  BookOpenIcon,
  ClockIcon,
  PlayIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import type { WorkshopStats } from '../../services/adminWorkshops.service'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
}

interface AdminWorkshopsStatsGridProps {
  stats: WorkshopStats | null
}

export function AdminWorkshopsStatsGrid({
  stats,
}: AdminWorkshopsStatsGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
    >
      <motion.div
        variants={itemVariants}
        className="p-4 bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-[#0A2540] dark:to-[#0A2540]/60 rounded-xl border border-[#E9ECEF] dark:border-[#0A2540]/20 shadow-sm dark:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-lg">
            <BookOpenIcon className="h-5 w-5 text-[#00D4B3]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
              Total Talleres
            </p>
            <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
              {stats?.totalWorkshops || 0}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="p-4 bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-[#10B981]/20 dark:to-[#10B981]/10 rounded-xl border border-[#E9ECEF] dark:border-[#10B981]/20 shadow-sm dark:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#10B981]/10 dark:bg-[#10B981]/20 rounded-lg">
            <PlayIcon className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C757D] dark:text-[#10B981] uppercase tracking-wide">
              Activos
            </p>
            <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
              {stats?.activeWorkshops || 0}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="p-4 bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-[#00D4B3]/20 dark:to-[#00D4B3]/10 rounded-xl border border-[#E9ECEF] dark:border-[#00D4B3]/20 shadow-sm dark:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-lg">
            <UserCircleIcon className="h-5 w-5 text-[#00D4B3]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C757D] dark:text-[#00D4B3] uppercase tracking-wide">
              Total Estudiantes
            </p>
            <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
              {stats?.totalStudents || 0}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="p-4 bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-[#F59E0B]/20 dark:to-[#F59E0B]/10 rounded-xl border border-[#E9ECEF] dark:border-[#F59E0B]/20 shadow-sm dark:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 rounded-lg">
            <ClockIcon className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C757D] dark:text-[#F59E0B] uppercase tracking-wide">
              Duracion Promedio
            </p>
            <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
              {stats?.averageDuration || 0} min
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
