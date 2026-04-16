'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, BookOpen, CheckCircle, ChevronDown, GraduationCap, Building, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  Course,
  AssignedCourse,
  CompanyMember,
  LearningPath,
  OrganizationLearningPathAssignment,
} from './courses-section.types'
import { colors } from './courses-section.types'

// ---- Catalog Modal ----
interface CatalogModalProps {
  isOpen: boolean
  onClose: () => void
  catalogSearch: string
  setCatalogSearch: (v: string) => void
  filteredCatalog: Course[]
  hierarchyCourses: AssignedCourse[]
  assigningId: string | null
  onAssign: (courseId: string) => void
}

export function CatalogModal({
  isOpen, onClose, catalogSearch, setCatalogSearch,
  filteredCatalog, hierarchyCourses, assigningId, onAssign
}: CatalogModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>

            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Catálogo Global</h4>
                  <p className="text-sm" style={{ color: colors.grayMedium }}>Selecciona cursos para adquirir de forma organizacional.</p>
                </div>
                <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grayMedium }} />
                <input
                  autoFocus
                  placeholder="Busca por título, categoría o nivel..."
                  className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-0 text-white focus:outline-none focus:ring-2 transition-all shadow-inner"
                  style={{ backgroundColor: colors.bgTertiary }}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {filteredCatalog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <BookOpen className="w-16 h-16 mb-4 opacity-5" />
                  <p className="text-lg font-bold text-white/20">No se encontraron cursos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCatalog.map(course => {
                    const isAlreadyPurchased = hierarchyCourses.some(hc => hc.course_id === course.id)
                    return (
                      <motion.div
                        key={course.id}
                        whileHover={{ y: -5 }}
                        className="group rounded-3xl overflow-hidden border transition-all flex flex-col"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="aspect-video relative overflow-hidden bg-black/40">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10"><BookOpen className="w-10 h-10" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-white border border-white/10">
                              {course.level}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{course.category}</p>
                          <h5 className="text-lg font-bold text-white leading-tight mb-6 line-clamp-2">{course.title}</h5>

                          <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                            {isAlreadyPurchased ? (
                              <div className="flex items-center gap-2 text-success">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Ya adquirido</span>
                              </div>
                            ) : (
                              <button
                                disabled={!!assigningId}
                                onClick={() => onAssign(course.id)}
                                className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                style={{ backgroundColor: colors.accent, color: colors.primary }}
                              >
                                {assigningId === course.id ? 'Procesando...' : 'Adquirir ahora'}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface LearningPathCatalogModalProps {
  isOpen: boolean
  onClose: () => void
  search: string
  setSearch: (v: string) => void
  filteredLearningPaths: LearningPath[]
  activeAssignments: OrganizationLearningPathAssignment[]
  assigningId: string | null
  onAssign: (learningPathId: string) => void
}

export function LearningPathCatalogModal({
  isOpen, onClose, search, setSearch,
  filteredLearningPaths, activeAssignments, assigningId, onAssign
}: LearningPathCatalogModalProps) {
  const { t } = useTranslation('admin')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>

            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('coursesSection.pathCatalogTitle')}</h4>
                  <p className="text-sm" style={{ color: colors.grayMedium }}>{t('coursesSection.pathCatalogSubtitle')}</p>
                </div>
                <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grayMedium }} />
                <input
                  autoFocus
                  placeholder={t('coursesSection.pathSearchPlaceholder')}
                  className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-0 text-white focus:outline-none focus:ring-2 transition-all shadow-inner"
                  style={{ backgroundColor: colors.bgTertiary }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {filteredLearningPaths.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Route className="w-16 h-16 mb-4 opacity-5" />
                  <p className="text-lg font-bold text-white/20">{t('coursesSection.noLearningPathsFound')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredLearningPaths.map(path => {
                    const isAlreadyAssigned = activeAssignments.some(assignment => assignment.learning_path_id === path.id && assignment.status === 'active')
                    return (
                      <motion.div
                        key={path.id}
                        whileHover={{ y: -5 }}
                        className="group rounded-3xl overflow-hidden border transition-all flex flex-col"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="p-6 flex-1 flex flex-col">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{t('coursesSection.sequentialPath')}</p>
                          <h5 className="text-lg font-bold text-white leading-tight mb-2">{path.title}</h5>
                          <p className="text-sm line-clamp-3 mb-6" style={{ color: colors.grayMedium }}>
                            {path.description || t('coursesSection.noDescription')}
                          </p>
                          <div className="text-[11px] font-medium mb-6" style={{ color: colors.grayMedium }}>
                            {t('coursesSection.workshopsInSequence', { count: path.item_count })}
                          </div>

                          <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                            {isAlreadyAssigned ? (
                              <div className="flex items-center gap-2 text-success">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">{t('coursesSection.alreadyAssigned')}</span>
                              </div>
                            ) : (
                              <button
                                disabled={!!assigningId}
                                onClick={() => onAssign(path.id)}
                                className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                style={{ backgroundColor: colors.accent, color: colors.primary }}
                              >
                                {assigningId === path.id
                                  ? t('coursesSection.processing')
                                  : t('coursesSection.assignPath')}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ---- Assign User Modal ----
interface AssignUserModalProps {
  isOpen: boolean
  onClose: () => void
  members: CompanyMember[]
  allCourses: Course[]
  selectedUserForCourse: string | null
  setSelectedUserForCourse: (v: string | null) => void
  selectedCourseForUser: string | null
  setSelectedCourseForUser: (v: string | null) => void
  isAssigning: boolean
  onConfirm: () => void
}

export function AssignUserModal({
  isOpen, onClose, members, allCourses,
  selectedUserForCourse, setSelectedUserForCourse,
  selectedCourseForUser, setSelectedCourseForUser,
  isAssigning, onConfirm
}: AssignUserModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>

            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Asignar a Usuario</h4>
              <p className="text-sm" style={{ color: colors.grayMedium }}>Asigna un curso específico del catálogo de la organización.</p>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>Seleccionar Miembro</label>
                <div className="relative group">
                  <select
                    className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={selectedUserForCourse || ''}
                    onChange={(e) => setSelectedUserForCourse(e.target.value)}
                  >
                    <option value="">Buscar miembro...</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user.display_name || m.user.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>Seleccionar Curso</label>
                <div className="relative group">
                  <select
                    className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={selectedCourseForUser || ''}
                    onChange={(e) => setSelectedCourseForUser(e.target.value)}
                  >
                    <option value="">Buscar curso...</option>
                    {allCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">Cancelar</button>
              <button
                disabled={!selectedUserForCourse || !selectedCourseForUser || isAssigning}
                onClick={onConfirm}
                className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface AssignLearningPathModalProps {
  isOpen: boolean
  onClose: () => void
  members: CompanyMember[]
  learningPaths: LearningPath[]
  selectedUserForLearningPath: string | null
  setSelectedUserForLearningPath: (v: string | null) => void
  selectedLearningPathForUser: string | null
  setSelectedLearningPathForUser: (v: string | null) => void
  isAssigning: boolean
  onConfirm: () => void
}

export function AssignLearningPathModal({
  isOpen, onClose, members, learningPaths,
  selectedUserForLearningPath, setSelectedUserForLearningPath,
  selectedLearningPathForUser, setSelectedLearningPathForUser,
  isAssigning, onConfirm
}: AssignLearningPathModalProps) {
  const { t } = useTranslation('admin')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('coursesSection.assignPathTitle')}</h4>
              <p className="text-sm" style={{ color: colors.grayMedium }}>{t('coursesSection.assignPathSubtitle')}</p>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>{t('coursesSection.selectMember')}</label>
                <div className="relative group">
                  <select
                    className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={selectedUserForLearningPath || ''}
                    onChange={(e) => setSelectedUserForLearningPath(e.target.value)}
                  >
                    <option value="">{t('coursesSection.memberPlaceholder')}</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user.display_name || m.user.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>{t('coursesSection.selectLearningPath')}</label>
                <div className="relative group">
                  <select
                    className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={selectedLearningPathForUser || ''}
                    onChange={(e) => setSelectedLearningPathForUser(e.target.value)}
                  >
                    <option value="">{t('coursesSection.pathPlaceholder')}</option>
                    {learningPaths.map(path => (
                      <option key={path.id} value={path.id}>{path.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">{t('coursesSection.cancel')}</button>
              <button
                disabled={!selectedUserForLearningPath || !selectedLearningPathForUser || isAssigning}
                onClick={onConfirm}
                className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {isAssigning
                  ? t('coursesSection.assigning')
                  : t('coursesSection.confirmAssignment')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ---- Search Bar ----
interface CoursesSearchBarProps {
  activeTab: 'org' | 'users'
  listSearch: string
  setListSearch: (v: string) => void
}

export function CoursesSearchBar({ activeTab, listSearch, setListSearch }: CoursesSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.grayMedium }} />
      <input
        placeholder={activeTab === 'org' ? 'Buscar en catálogo adquirido...' : 'Buscar por usuario o curso...'}
        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm text-white focus:outline-none transition-all shadow-sm"
        style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
        value={listSearch}
        onChange={(e) => setListSearch(e.target.value)}
      />
    </div>
  )
}

// ---- Tab Selector + Action Buttons ----
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
            style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `${colors.accent}10` }}
          >
            <Route className="w-5 h-5" />
            {t('coursesSection.assignPath')}
          </motion.button>
          {activeTab === 'users' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAssignUser}
                className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border"
                style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `${colors.accent}10` }}
              >
                <GraduationCap className="w-5 h-5" />
                Asignar Curso
              </motion.button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
