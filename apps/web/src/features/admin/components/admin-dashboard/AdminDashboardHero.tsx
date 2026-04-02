'use client'

import { motion } from 'framer-motion'
import {
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface AdminDashboardHeroProps {
  greeting: string
  todayLabel: string
  userName: string
}

export function AdminDashboardHero({
  greeting,
  todayLabel,
  userName,
}: AdminDashboardHeroProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0A2540]/90 p-8"
      initial={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00D4B3] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#00D4B3] blur-3xl" />
      </div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5], y: [0, -10, 0] }}
        className="absolute right-20 top-10 h-2 w-2 rounded-full bg-[#00D4B3]"
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3], y: [0, 10, 0] }}
        className="absolute bottom-10 right-40 h-3 w-3 rounded-full bg-[#00D4B3]"
        transition={{ delay: 1, duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
          >
            <SparklesIcon className="h-6 w-6 text-[#00D4B3]" />
          </motion.div>
          <span className="text-sm font-medium uppercase tracking-wide text-[#00D4B3]">
            Panel de Control
          </span>
        </div>

        <motion.h1
          animate={{ opacity: 1, x: 0 }}
          className="mb-2 text-3xl font-bold text-white lg:text-4xl"
          initial={{ opacity: 0, x: -20 }}
          transition={{ delay: 0.2 }}
        >
          {greeting}, {userName}
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, x: 0 }}
          className="max-w-xl text-lg text-white/70"
          initial={{ opacity: 0, x: -20 }}
          transition={{ delay: 0.3 }}
        >
          Gestiona tu plataforma de aprendizaje con IA. Tienes el control total.
        </motion.p>

        <motion.div
          animate={{ opacity: 1 }}
          className="mt-6 flex items-center gap-6"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 text-sm text-white/60">
            <ClockIcon className="h-4 w-4" />
            {todayLabel}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
            <span className="text-sm font-medium text-[#10B981]">
              Sistema Operativo
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{ opacity: 0.1, scale: 1 }}
        className="absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block"
        initial={{ opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <ShieldCheckIcon className="h-48 w-48 text-white" />
      </motion.div>
    </motion.div>
  )
}
