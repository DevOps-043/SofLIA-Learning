'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

import { useCourseManagementContext } from './CourseManagementContext'

export function CourseManagementHeader() {
  const {
    state: { isNewCourse, router },
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-[#0A2540] dark:text-white">
            {isNewCourse ? 'Crear Nuevo Curso' : 'Gestion de Curso'}
          </h1>
          <p className="text-sm text-[#6C757D] dark:text-white/60">
            Administra modulos, lecciones, materiales y actividades
          </p>
        </div>
      </div>
    </motion.div>
  )
}
