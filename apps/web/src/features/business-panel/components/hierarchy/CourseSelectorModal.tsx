import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import Image from 'next/image'
import { X, Search, BookOpen, Check } from 'lucide-react'
import { BusinessCourse, useBusinessCourses } from '@/features/business-panel/hooks/useBusinessCourses'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

interface CourseSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (courseIds: string[]) => void
  isLoading?: boolean
  title?: string
}

export function CourseSelectorModal({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
  title = 'Añadir Cursos'
}: CourseSelectorModalProps) {
  const { courses, isLoading: isLoadingCourses } = useBusinessCourses()
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const primaryColor = panelStyles?.primary_button_color || 'var(--color-primary)'
  const accentColor = panelStyles?.accent_color || primaryColor
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-carbon-800 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gray-300 dark:focus:border-white/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingCourses ? (
            <div className="text-center py-8 text-gray-500 dark:text-white/40">Cargando cursos...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-white/40">No se encontraron cursos</div>
          ) : (
            filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => toggleSelection(course.id)}
                className={`
                  relative flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedIds.has(course.id) 
                    ? 'bg-blue-500/10 border-blue-500/50' 
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'}
                `}
              >
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {course.thumbnail_url ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={course.thumbnail_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <BookOpen className="w-6 h-6 text-gray-400 dark:text-white/40" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/50 mt-1">
                    <span>{course.level || 'General'}</span>
                    <span className="text-gray-300 dark:text-white/30">•</span>
                    <span>{course.category || 'Sin categoría'}</span>
                  </div>
                </div>

                <div className={`
                  w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                  ${selectedIds.has(course.id)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-300 dark:border-white/20 text-transparent'}
                `}>
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || selectedIds.size === 0}
            className="px-6 py-2 rounded-xl text-white font-medium shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg drop-shadow-md"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            {isLoading ? 'Añadiendo...' : `Añadir ${selectedIds.size} Cursos`}
          </button>
        </div>

      </div>
    </div>
  )
}
