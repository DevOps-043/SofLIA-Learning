'use client'

import { motion } from 'framer-motion'
import { Building, GraduationCap, Plus, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { colors } from '../courses-section.types'

interface CoursesHeaderProps {
  activeTab: 'org' | 'users'
  setActiveTab: (tab: 'org' | 'users') => void
  onOpenCatalog: () => void
  onOpenLearningPathCatalog: () => void
  onAssignUser: () => void
}

export function CoursesHeader({
  activeTab,
  setActiveTab,
  onOpenCatalog,
  onOpenLearningPathCatalog,
  onAssignUser,
}: CoursesHeaderProps) {
  const { t } = useTranslation('admin')

  return (
    <>
      <div className="flex p-1 rounded-2xl w-fit" style={{ backgroundColor: colors.bgTertiary }}>
        <button onClick={() => setActiveTab('org')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'org' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
          <Building className="w-4 h-4" />
          Acceso Organizacional
        </button>
        <button onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
          <GraduationCap className="w-4 h-4" />
          Asignaciones Individuales
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {activeTab === 'org' ? 'Cursos de la Organización' : 'Asignaciones Mensuales'}
          </h3>
          <p className="text-sm" style={{ color: colors.grayMedium }}>
            {activeTab === 'org'
              ? 'Gestiona el catálogo general disponible para todos los miembros.'
              : 'Asigna cursos específicos a usuarios seleccionados.'}
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onOpenCatalog}
            className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: colors.accent, color: colors.primary }}>
            <Plus className="w-5 h-5" />
            Adquirir Curso
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onOpenLearningPathCatalog}
            className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border"
            style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `${colors.accent}10` }}>
            <Route className="w-5 h-5" />
            {t('coursesSection.assignPath')}
          </motion.button>
          {activeTab === 'users' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onAssignUser}
              className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border"
              style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `${colors.accent}10` }}>
              <GraduationCap className="w-5 h-5" />
              Asignar Curso
            </motion.button>
          )}
        </div>
      </div>
    </>
  )
}
