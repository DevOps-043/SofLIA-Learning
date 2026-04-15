'use client'

import { Reorder, motion } from 'framer-motion'
import { Book, Plus, RefreshCw } from 'lucide-react'

import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'
import { ModuleCard } from './ModuleCard'

export function CourseModulesTab() {
  const {
    state: {
      showFeedbackMessage,
      recalculatingDurations,
      setRecalculatingDurations,
      fetchModules,
      orderedModules,
      handleModulesReorder,
      setSelectedModule,
      setShowModuleModal,
      modules,
      modulesLoading,
      expandedModules,
    },
    courseId,
  } = useCourseManagementContext()
  const { t } = useTranslation('admin')

  return (
    <motion.div
      key="modules"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">
            Modulos del Curso
          </h2>
          <p className="mt-1 text-sm text-[#6C757D] dark:text-white/60">
            Organiza el contenido en modulos y lecciones
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
          <motion.button
            onClick={async () => {
              try {
                setRecalculatingDurations(true)
                const res = await fetch('/api/admin/recalculate-durations', {
                  method: 'POST',
                })
                const data = await res.json()

                if (data.success) {
                  showFeedbackMessage(
                    'success',
                    data.message || 'Duraciones recalculadas correctamente',
                  )
                  await fetchModules(courseId)
                } else {
                  showFeedbackMessage(
                    'error',
                    data.error || 'Error al recalcular duraciones',
                  )
                }
              } catch {
                showFeedbackMessage(
                  'error',
                  'Error de conexion al recalcular duraciones',
                )
              } finally {
                setRecalculatingDurations(false)
              }
            }}
            disabled={recalculatingDurations}
            whileHover={{
              scale: recalculatingDurations ? 1 : 1.05,
              y: recalculatingDurations ? 0 : -2,
            }}
            whileTap={{ scale: recalculatingDurations ? 1 : 0.95 }}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#E9ECEF] bg-[#E9ECEF] px-3 py-2 text-xs font-medium text-[#6C757D] shadow-sm transition-all duration-200 hover:border-[#00D4B3]/30 hover:bg-[#00D4B3]/10 hover:text-[#00D4B3] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white/60 dark:hover:bg-[#00D4B3]/20 sm:w-auto"
            title={t('courseManagement.recalcDurations')}
          >
            <motion.div
              animate={recalculatingDurations ? { rotate: 360 } : {}}
              transition={
                recalculatingDurations
                  ? { duration: 1, repeat: Infinity, ease: 'linear' }
                  : {}
              }
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </motion.div>
            <span>
              {recalculatingDurations ? 'Recalculando...' : 'Recalcular tiempos'}
            </span>
          </motion.button>

          <motion.button
            onClick={() => {
              setSelectedModule(null)
              setShowModuleModal(true)
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-4 py-3 text-sm font-medium text-white shadow-md shadow-[#0A2540]/20 transition-all duration-200 hover:from-[#0d2f4d] hover:to-[#0A2540] hover:shadow-lg hover:shadow-[#0A2540]/30 sm:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <Plus className="h-4 w-4" />
            </motion.div>
            <span className="relative z-10">Agregar Modulo</span>
          </motion.button>
        </div>
      </div>

      {modulesLoading ? (
        <div className="py-16 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mx-auto mb-3 h-12 w-12 rounded-full border-3 border-[#00D4B3]/20 border-t-[#00D4B3]"
          />
          <p className="text-sm text-[#6C757D] dark:text-white/60">
            Cargando modulos...
          </p>
        </div>
      ) : modules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-[#E9ECEF] bg-white py-16 text-center shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D4B3]/10 to-[#0A2540]/10 dark:from-[#00D4B3]/20 dark:to-[#0A2540]/20"
          >
            <Book className="h-8 w-8 text-[#00D4B3]" />
          </motion.div>
          <p className="mb-1.5 text-base font-semibold text-[#0A2540] dark:text-white">
            No hay modulos aun
          </p>
          <p className="mb-5 text-xs text-[#6C757D] dark:text-white/60">
            Comienza creando tu primer modulo
          </p>
          <motion.button
            onClick={() => {
              setSelectedModule(null)
              setShowModuleModal(true)
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-[#0d2f4d] hover:to-[#0A2540] hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Crear tu primer modulo</span>
          </motion.button>
        </motion.div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedModules}
          onReorder={handleModulesReorder}
          className="mx-auto max-w-4xl space-y-4"
        >
          {orderedModules.map((module, index) => (
            <ModuleCard
              key={module.module_id}
              module={module}
              index={index}
              isExpanded={expandedModules.has(module.module_id)}
            />
          ))}
        </Reorder.Group>
      )}
    </motion.div>
  )
}
