'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Search, X } from 'lucide-react'
import type { AssignedCourse, Course } from '../courses-section.types'
import { colors } from '../courses-section.types'
import { CatalogCourseCard } from './CatalogCourseCard'

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
  isOpen,
  onClose,
  catalogSearch,
  setCatalogSearch,
  filteredCatalog,
  hierarchyCourses,
  assigningId,
  onAssign,
}: CatalogModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="dark fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Catalogo Global</h4>
                  <p className="text-sm" style={{ color: colors.grayMedium }}>
                    Selecciona cursos para adquirir de forma organizacional.
                  </p>
                </div>
                <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grayMedium }} />
                <input
                  autoFocus
                  placeholder="Busca por titulo, categoria o nivel..."
                  className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-0 text-white focus:outline-none focus:ring-2 transition-all shadow-inner"
                  style={{ backgroundColor: colors.bgTertiary }}
                  value={catalogSearch}
                  onChange={event => setCatalogSearch(event.target.value)}
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
                  {filteredCatalog.map(course => (
                    <CatalogCourseCard
                      key={course.id}
                      course={course}
                      hierarchyCourses={hierarchyCourses}
                      assigningId={assigningId}
                      onAssign={onAssign}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
