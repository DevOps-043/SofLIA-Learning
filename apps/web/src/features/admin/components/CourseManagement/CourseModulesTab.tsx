'use client'

import { motion } from 'framer-motion'
import { Plus, Book, RefreshCw } from 'lucide-react'
import { Reorder } from 'framer-motion'
import { useCourseManagementContext } from './CourseManagementContext'
import { ModuleCard } from './ModuleCard'

export function CourseModulesTab() {
  const {
    state: {
      showFeedbackMessage,
      recalculatingDurations, setRecalculatingDurations,
      fetchModules,
      orderedModules,
      handleModulesReorder,
      setSelectedModule, setShowModuleModal,
      modules, modulesLoading,
      expandedModules,
    },
    courseId,
  } = useCourseManagementContext()

  return (
    <motion.div
      key="modules"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">Módulos del Curso</h2>
          <p className="text-xs text-[#6C757D] dark:text-white/60 mt-1">
            Organiza el contenido en módulos y lecciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={async () => {
              try {
                setRecalculatingDurations(true)
                const res = await fetch('/api/admin/recalculate-durations', { method: 'POST' })
                const data = await res.json()
                if (data.success) {
                  showFeedbackMessage('success', data.message || 'Duraciones recalculadas correctamente')
                  await fetchModules(courseId)
                } else {
                  showFeedbackMessage('error', data.error || 'Error al recalcular duraciones')
                }
              } catch {
                showFeedbackMessage('error', 'Error de conexión al recalcular duraciones')
              } finally {
                setRecalculatingDurations(false)
              }
            }}
            disabled={recalculatingDurations}
            whileHover={{ scale: recalculatingDurations ? 1 : 1.05, y: recalculatingDurations ? 0 : -2 }}
            whileTap={{ scale: recalculatingDurations ? 1 : 0.95 }}
            className="group relative px-3 py-2 bg-[#E9ECEF] dark:bg-[#0A0D12] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 text-[#6C757D] dark:text-white/60 hover:text-[#00D4B3] rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden text-xs font-medium border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Recalcular duraciones de todas las lecciones"
          >
            <motion.div
              animate={recalculatingDurations ? { rotate: 360 } : {}}
              transition={recalculatingDurations ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            <span>{recalculatingDurations ? 'Recalculando...' : 'Recalcular tiempos'}</span>
          </motion.button>
          <motion.button
            onClick={() => { setSelectedModule(null); setShowModuleModal(true) }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg flex items-center gap-2 shadow-md shadow-[#0A2540]/20 hover:shadow-lg hover:shadow-[#0A2540]/30 transition-all duration-200 overflow-hidden text-sm font-medium"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <motion.div animate={{ rotate: [0, 90, 0] }} transition={{ duration: 0.2 }} className="relative z-10">
              <Plus className="w-4 h-4" />
            </motion.div>
            <span className="relative z-10">Agregar Módulo</span>
          </motion.button>
        </div>
      </div>

      {/* Lista de Módulos */}
      {modulesLoading ? (
        <div className="text-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mx-auto mb-3"
          />
          <p className="text-sm text-[#6C757D] dark:text-white/60">Cargando módulos...</p>
        </div>
      ) : modules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-gradient-to-br from-[#00D4B3]/10 to-[#0A2540]/10 dark:from-[#00D4B3]/20 dark:to-[#0A2540]/20 rounded-xl flex items-center justify-center mx-auto mb-4"
          >
            <Book className="w-8 h-8 text-[#00D4B3]" />
          </motion.div>
          <p className="text-[#0A2540] dark:text-white text-base mb-1.5 font-semibold">No hay módulos aún</p>
          <p className="text-[#6C757D] dark:text-white/60 text-xs mb-5">Comienza creando tu primer módulo</p>
          <motion.button
            onClick={() => { setSelectedModule(null); setShowModuleModal(true) }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Crear tu primer módulo</span>
          </motion.button>
        </motion.div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedModules}
          onReorder={handleModulesReorder}
          className="space-y-4 max-w-4xl mx-auto"
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
