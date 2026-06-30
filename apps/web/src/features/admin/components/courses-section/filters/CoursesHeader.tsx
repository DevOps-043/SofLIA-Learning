'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Building, GraduationCap, Plus, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { colors } from '../courses-section.types'

type ContentTypeFilter = 'all' | 'courses' | 'paths'

interface CoursesHeaderProps {
  activeTab: 'org' | 'users'
  setActiveTab: (tab: 'org' | 'users') => void
  contentTypeFilter: ContentTypeFilter
  setContentTypeFilter: (filter: ContentTypeFilter) => void
  onOpenCatalog: () => void
  onOpenLearningPathCatalog: () => void
  onAssignUser: () => void
}

const TYPE_FILTERS: Array<{ value: ContentTypeFilter; label: string; icon: ReactNode }> = [
  { value: 'all', label: 'Todo el contenido', icon: null },
  { value: 'courses', label: 'Cursos', icon: <BookOpen className="w-3 h-3" /> },
  { value: 'paths', label: 'Rutas', icon: <Route className="w-3 h-3" /> },
]

export function CoursesHeader({
  activeTab,
  setActiveTab,
  contentTypeFilter,
  setContentTypeFilter,
  onOpenCatalog,
  onOpenLearningPathCatalog,
  onAssignUser,
}: CoursesHeaderProps) {
  const { t } = useTranslation('admin')

  return (
    <>
      {/* Scope tab toggle */}
      <div className="flex p-1 rounded-2xl w-fit" style={{ backgroundColor: colors.bgTertiary }}>
        <button
          onClick={() => setActiveTab('org')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'org' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
        >
          <Building className="w-4 h-4" />
          Acceso Organizacional
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
        >
          <GraduationCap className="w-4 h-4" />
          Asignaciones Individuales
        </button>
      </div>

      {/* Title row + actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {activeTab === 'org' ? 'Contenido y Rutas de Aprendizaje' : 'Asignaciones Individuales'}
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.grayMedium }}>
            {activeTab === 'org'
              ? 'Gestiona los cursos y rutas disponibles para todos los miembros de la organización.'
              : 'Asigna cursos y rutas de aprendizaje a usuarios específicos.'}
          </p>

          {/* Content type filter chips */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {TYPE_FILTERS.map(({ value, label, icon }) => {
              const isActive = contentTypeFilter === value
              return (
                <button
                  key={value}
                  onClick={() => setContentTypeFilter(value)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border"
                  style={
                    isActive
                      ? { backgroundColor: colors.accent, color: colors.primary, borderColor: colors.accent }
                      : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }
                  }
                >
                  {icon}
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCatalog}
            className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: colors.accent, color: colors.primary }}
          >
            <Plus className="w-5 h-5" />
            Adquirir Curso
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenLearningPathCatalog}
            className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border"
            style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `color-mix(in srgb, ${colors.accent} 6.3%, transparent)` }}
          >
            <Route className="w-5 h-5" />
            {t('coursesSection.assignPath')}
          </motion.button>
          {activeTab === 'users' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAssignUser}
              className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border"
              style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `color-mix(in srgb, ${colors.accent} 6.3%, transparent)` }}
            >
              <GraduationCap className="w-5 h-5" />
              Asignar Curso
            </motion.button>
          )}
        </div>
      </div>
    </>
  )
}
