'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Search, X } from 'lucide-react'
import type { AssignedCourse, Course } from '../courses-section.types'
import { CourseCatalogCard } from './CourseCatalogCard'

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
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md dark:bg-black/80" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col border-gray-200 bg-white dark:border-white/10 dark:bg-carbon-800">
            <div className="p-8 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Catálogo Global</h4>
                  <p className="text-sm text-gray-500 dark:text-white/60">Selecciona cursos para adquirir de forma organizacional.</p>
                </div>
                <button onClick={onClose} className="p-3 rounded-2xl transition-all text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
                <input
                  autoFocus
                  placeholder="Busca por título, categoría o nivel..."
                  className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-accent border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-carbon-900 dark:text-white dark:placeholder:text-white/40"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {filteredCatalog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <BookOpen className="w-16 h-16 mb-4 text-gray-300 dark:text-white/10" />
                  <p className="text-lg font-bold text-gray-400 dark:text-white/20">No se encontraron cursos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCatalog.map(course => (
                    <CourseCatalogCard key={course.id} course={course} hierarchyCourses={hierarchyCourses} assigningId={assigningId} onAssign={onAssign} />
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
