'use client'

import { motion } from 'framer-motion'
import { Building, GraduationCap, Plus, Route } from 'lucide-react'
import type { ReactNode } from 'react'
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
        <TabButton active={activeTab === 'org'} onClick={() => setActiveTab('org')} icon={<Building className="w-4 h-4" />}>
          Acceso Organizacional
        </TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<GraduationCap className="w-4 h-4" />}>
          Asignaciones Individuales
        </TabButton>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {activeTab === 'org' ? 'Cursos de la Organizacion' : 'Asignaciones Mensuales'}
          </h3>
          <p className="text-sm" style={{ color: colors.grayMedium }}>
            {activeTab === 'org'
              ? 'Gestiona el catalogo general disponible para todos los miembros.'
              : 'Asigna cursos especificos a usuarios seleccionados.'}
          </p>
        </div>
        <div className="flex gap-3">
          <HeaderAction onClick={onOpenCatalog} solid icon={<Plus className="w-5 h-5" />}>
            Adquirir Curso
          </HeaderAction>
          <HeaderAction onClick={onOpenLearningPathCatalog} icon={<Route className="w-5 h-5" />}>
            {t('coursesSection.assignPath')}
          </HeaderAction>
          {activeTab === 'users' && (
            <HeaderAction onClick={onAssignUser} icon={<GraduationCap className="w-5 h-5" />}>
              Asignar Curso
            </HeaderAction>
          )}
        </div>
      </div>
    </>
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  const className = active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'

  return (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${className}`}>
      {icon}
      {children}
    </button>
  )
}

function HeaderAction({ children, icon, onClick, solid = false }: { children: ReactNode; icon: ReactNode; onClick: () => void; solid?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border shadow-lg"
      style={{
        backgroundColor: solid ? colors.accent : `color-mix(in srgb, ${colors.accent} 6.3%, transparent)`,
        borderColor: colors.accent,
        color: solid ? colors.primary : colors.accent,
      }}
    >
      {icon}
      {children}
    </motion.button>
  )
}
