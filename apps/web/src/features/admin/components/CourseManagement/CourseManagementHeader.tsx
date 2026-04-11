'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'

import { useCourseManagementContext } from './CourseManagementContext'

export function CourseManagementHeader() {
  const {
    state: { estimatingMissingTimes, handleEstimateMissingTimes, isNewCourse, router },
  } = useCourseManagementContext()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <motion.button
        onClick={() => router.back()}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        className="group mb-6 inline-flex items-center text-[#6C757D] transition-colors hover:text-[#0A2540] dark:text-white/60 dark:hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform" />
        <span className="text-sm font-medium">Volver a Talleres</span>
      </motion.button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-bold text-[#0A2540] dark:text-white sm:text-3xl md:text-4xl">
            {isNewCourse ? 'Crear Nuevo Curso' : 'Gestion de Curso'}
          </h1>
          <p className="max-w-2xl text-sm text-[#6C757D] dark:text-white/60 sm:text-base">
            Administra modulos, lecciones, materiales y actividades
          </p>
        </div>

        {!isNewCourse && (
          <motion.button
            onClick={() => void handleEstimateMissingTimes()}
            disabled={estimatingMissingTimes}
            whileHover={{ scale: estimatingMissingTimes ? 1 : 1.02 }}
            whileTap={{ scale: estimatingMissingTimes ? 1 : 0.98 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4B3] to-[#00C2A5] px-4 py-3 text-sm font-semibold text-[#0A2540] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:justify-start"
          >
            {estimatingMissingTimes ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A2540] border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>
              {estimatingMissingTimes
                ? 'Estimando tiempos...'
                : 'Estimar tiempos con IA'}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
