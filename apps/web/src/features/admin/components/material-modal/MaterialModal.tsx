'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { FileText, Link as LinkIcon, BookOpen, FileQuestion, PenTool } from 'lucide-react'
import type { AdminMaterial, CreateMaterialData, UpdateMaterialData } from '../../services/adminMaterials.service'
import { useMaterialFormState } from './useMaterialFormState'
import { BasicTabFields } from './VideoMaterialContent'
import { PDFMaterialContent } from './PDFMaterialContent'
import { QuizContent } from './VideoMaterialContent'

interface MaterialModalProps {
  material?: AdminMaterial | null
  lessonId: string
  onClose: () => void
  onSave: (data: CreateMaterialData | UpdateMaterialData) => Promise<void>
}

export function MaterialModal({ material, lessonId, onClose, onSave }: MaterialModalProps) {
  const {
    formData, setFormData, quizQuestions, setQuizQuestions,
    loading, error, activeTab, setActiveTab,
    autoCalculatedTime, setAutoCalculatedTime, handleSubmit
  } = useMaterialFormState({ material, onSave, onClose })

  // El recuadro de error se renderiza arriba del formulario; al fallar el guardado
  // desde el botón (al fondo), lo traemos a la vista para dar feedback claro.
  const errorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  const getMaterialTypeIcon = () => {
    switch (formData.material_type) {
      case 'pdf': case 'document': return FileText
      case 'link': return LinkIcon
      case 'reading': return BookOpen
      case 'quiz': return FileQuestion
      case 'exercise': return PenTool
      default: return FileText
    }
  }

  const MaterialTypeIcon = getMaterialTypeIcon()

  const tabs = [
    { id: 'basic' as const, label: 'Básica', icon: FileText },
    { id: 'content' as const, label: 'Contenido', icon: BookOpen }
  ]

  return (
    <AnimatePresence>
      {true && (
        <>
          {/* z-[1000]: el AdminHeader es sticky con z-[999]; con menos z-index
              el topbar tapa el encabezado del modal. */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[1000] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 dark:border-gray-500/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary to-primary/90 dark:from-primary dark:to-primary/80 px-6 py-4 border-b border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{material ? 'Editar Material' : 'Crear Material'}</h3>
                        <p className="text-xs text-white/70">{material ? 'Modifica la información del material' : 'Agrega un nuevo material a la lección'}</p>
                      </div>
                    </div>
                    <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200">
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 bg-gray-200/50 dark:bg-carbon-950 border-b border-gray-200 dark:border-gray-500/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive ? 'text-accent bg-accent/10 dark:bg-accent/20' : 'text-gray-500 dark:text-white/60 hover:text-primary dark:hover:text-white hover:bg-gray-200 dark:hover:bg-carbon-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-accent/10 dark:bg-accent/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div ref={errorRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl">
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {activeTab === 'basic' && (
                        <motion.div key="basic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
                          <BasicTabFields
                            formData={formData} setFormData={setFormData}
                            autoCalculatedTime={autoCalculatedTime} setAutoCalculatedTime={setAutoCalculatedTime}
                            MaterialTypeIcon={MaterialTypeIcon}
                          />
                        </motion.div>
                      )}

                      {activeTab === 'content' && (
                        <motion.div key="content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
                          {formData.material_type === 'quiz' ? (
                            <QuizContent quizQuestions={quizQuestions} setQuizQuestions={setQuizQuestions} />
                          ) : (
                            <PDFMaterialContent formData={formData} setFormData={setFormData} setAutoCalculatedTime={setAutoCalculatedTime} />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-500/30 bg-gray-200/30 dark:bg-carbon-950">
                    <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-white/60 bg-white dark:bg-carbon-800 border border-gray-200 dark:border-gray-500/30 rounded-lg hover:bg-gray-200 dark:hover:bg-primary/20 transition-all duration-200">
                      Cancelar
                    </motion.button>
                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none">
                      {loading ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Guardando...</span></>
                      ) : (
                        <><CheckCircleIcon className="h-4 w-4" /><span>Guardar</span></>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
