'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { FileText, Link as LinkIcon, BookOpen, FileQuestion, PenTool, Clock, Sparkles, Type } from 'lucide-react'
import type {
  AdminMaterial,
  CreateMaterialData,
  UpdateMaterialData,
} from '../services/adminMaterials.service'
import { PDFUpload } from './PDFUpload'
import { QuizBuilder } from './QuizBuilder'
import type { QuizQuestion } from './QuizBuilder'
import { calculateReadingTimeDetailed, READING_SPEEDS } from '@/lib/utils/readingTime'

interface MaterialModalProps {
  material?: AdminMaterial | null
  lessonId: string
  onClose: () => void
  onSave: (data: CreateMaterialData | UpdateMaterialData) => Promise<void>
}

type TabType = 'basic' | 'content'
type MaterialType = AdminMaterial['material_type']

interface MaterialFormData {
  material_title: string
  material_description: string
  material_type: MaterialType
  file_url: string
  external_url: string
  content_data: Record<string, unknown> | null
  is_downloadable: boolean
  estimated_time_minutes: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!isRecord(value)) {
    return false
  }

  const questionType = value.questionType
  const options = value.options

  return (
    typeof value.id === 'string' &&
    typeof value.question === 'string' &&
    typeof questionType === 'string' &&
    ['multiple_choice', 'true_false', 'short_answer'].includes(questionType) &&
    (options === undefined || (Array.isArray(options) && options.every(option => typeof option === 'string'))) &&
    typeof value.correctAnswer === 'string' &&
    (value.explanation === undefined || typeof value.explanation === 'string') &&
    typeof value.points === 'number'
  )
}

function getQuizQuestions(contentData: Record<string, unknown> | null): QuizQuestion[] {
  if (!isRecord(contentData) || !Array.isArray(contentData.questions)) {
    return []
  }

  return contentData.questions.filter(isQuizQuestion)
}

function normalizeQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((question) => {
    if (question.questionType !== 'true_false') {
      return question
    }

    const options = question.options
    if (
      !options ||
      options.length !== 2 ||
      !['Verdadero', 'Falso'].includes(options[0]) ||
      !['Verdadero', 'Falso'].includes(options[1])
    ) {
      return {
        ...question,
        options: ['Verdadero', 'Falso'],
      }
    }

    return question
  })
}

/**
 * Componente para editar contenido de lectura con cálculo automático de tiempo.
 * Detecta el número de palabras y calcula el tiempo estimado usando 180 PPM (lectura reflexiva).
 */
interface ReadingContentEditorProps {
  value: string
  onChange: (text: string, calculatedMinutes: number) => void
}

function ReadingContentEditor({ value, onChange }: ReadingContentEditorProps) {
  const [localValue, setLocalValue] = useState(value)

  // Calcular información de lectura
  const readingInfo = useMemo(() => {
    return calculateReadingTimeDetailed(localValue, 'slow')
  }, [localValue])

  // Sincronizar valor externo
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Manejar cambios con debounce implícito
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setLocalValue(newText)

    // Calcular tiempo y notificar al padre
    const info = calculateReadingTimeDetailed(newText, 'slow')
    onChange(newText, info.estimatedMinutes)
  }, [onChange])

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
        Contenido de Lectura
      </label>

      <div className="relative">
        <textarea
          rows={10}
          value={localValue}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
          placeholder="Pega o escribe el contenido de la lectura aquí. El tiempo estimado se calculará automáticamente..."
        />
      </div>

      {/* Panel de información de lectura */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4 p-3 bg-gradient-to-r from-[#00D4B3]/10 to-[#0A2540]/10 dark:from-[#00D4B3]/20 dark:to-[#0A2540]/20 rounded-xl border border-[#00D4B3]/20"
      >
        {/* Contador de palabras */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
            <Type className="w-4 h-4 text-[#00D4B3]" />
          </div>
          <div>
            <p className="text-xs text-[#6C757D] dark:text-white/60">Palabras</p>
            <p className="text-sm font-bold text-[#0A2540] dark:text-white">
              {readingInfo.wordCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-[#E9ECEF] dark:bg-[#6C757D]/30" />

        {/* Tiempo estimado */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-[#00D4B3]" />
          </div>
          <div>
            <p className="text-xs text-[#6C757D] dark:text-white/60">Tiempo Estimado</p>
            <p className="text-sm font-bold text-[#0A2540] dark:text-white">
              {readingInfo.formattedTime}
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-[#E9ECEF] dark:bg-[#6C757D]/30" />

        {/* Indicador de cálculo automático */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#00D4B3]" />
          </div>
          <div>
            <p className="text-xs text-[#6C757D] dark:text-white/60">Velocidad</p>
            <p className="text-xs font-medium text-[#0A2540] dark:text-white/80">
              {READING_SPEEDS.slow.wordsPerMinute} ppm (lectura reflexiva)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Nota explicativa */}
      <p className="text-xs text-[#6C757D] dark:text-white/50 flex items-start gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#00D4B3] mt-0.5 flex-shrink-0" />
        <span>
          El tiempo se calcula automáticamente usando una velocidad de lectura reflexiva (180 palabras/min),
          ideal para contenido educativo que requiere comprensión profunda.
        </span>
      </p>
    </div>
  )
}


export function MaterialModal({ material, lessonId, onClose, onSave }: MaterialModalProps) {
  const [formData, setFormData] = useState<MaterialFormData>({
    material_title: '',
    material_description: '',
    material_type: 'pdf' as 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading',
    file_url: '',
    external_url: '',
    content_data: null,
    is_downloadable: false,
    estimated_time_minutes: 10 // Default 10 minutes
  })
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [autoCalculatedTime, setAutoCalculatedTime] = useState(false)

  const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
    { id: 'basic', label: 'Básica', icon: FileText },
    { id: 'content', label: 'Contenido', icon: BookOpen }
  ]

  useEffect(() => {
    if (material) {
      setFormData({
        material_title: material.material_title,
        material_description: material.material_description || '',
        material_type: material.material_type,
        file_url: material.file_url || '',
        external_url: material.external_url || '',
        content_data: material.content_data || null,
        is_downloadable: material.is_downloadable,
        estimated_time_minutes: material.estimated_time_minutes || 10
      })
      // Cargar preguntas del quiz si existe
      if (material.material_type === 'quiz' && material.content_data) {
        setQuizQuestions(normalizeQuizQuestions(getQuizQuestions(material.content_data)))
      }
    }
  }, [material])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const dataToSave = { ...formData }

      // Si es un quiz, incluir las preguntas en content_data
      if (formData.material_type === 'quiz') {
        dataToSave.content_data = {
          questions: quizQuestions,
          totalPoints: quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)
        }
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar el material'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getMaterialTypeIcon = () => {
    switch (formData.material_type) {
      case 'pdf':
      case 'document':
        return FileText
      case 'link':
        return LinkIcon
      case 'reading':
        return BookOpen
      case 'quiz':
        return FileQuestion
      case 'exercise':
        return PenTool
      default:
        return FileText
    }
  }

  const MaterialTypeIcon = getMaterialTypeIcon()

  return (
    <AnimatePresence>
      {true && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Rediseñado */}
                <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#00D4B3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {material ? 'Editar Material' : 'Crear Material'}
                        </h3>
                        <p className="text-xs text-white/70">
                          {material ? 'Modifica la información del material' : 'Agrega un nuevo material a la lección'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                          ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                          : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {/* Tab: Básica */}
                      {activeTab === 'basic' && (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="group">
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Título del Material *
                            </label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                              <input
                                type="text"
                                required
                                value={formData.material_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, material_title: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                placeholder="Ej: Guía de Python"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Descripción
                            </label>
                            <textarea
                              rows={3}
                              value={formData.material_description}
                              onChange={(e) => setFormData(prev => ({ ...prev, material_description: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Descripción del material..."
                            />
                          </div>

                          <div className="group">
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Tipo de Material *
                            </label>
                            <div className="relative">
                              <MaterialTypeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                              <select
                                value={formData.material_type}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  material_type: e.target.value as MaterialType,
                                  file_url: '',
                                  external_url: ''
                                }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                              >
                                <option value="pdf">PDF</option>
                                <option value="document">Documento Word</option>
                                <option value="link">Enlace Externo</option>
                                <option value="reading">Lectura</option>
                                <option value="quiz">Quiz</option>
                                <option value="exercise">Ejercicio</option>
                              </select>
                            </div>
                          </div>

                          <div className="group">
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide flex items-center gap-2">
                              Tiempo Estimado (minutos) *
                              {formData.material_type === 'reading' && autoCalculatedTime && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00D4B3]/10 text-[#00D4B3] text-[10px] font-medium rounded-full">
                                  <Sparkles className="w-3 h-3" />
                                  Auto-calculado
                                </span>
                              )}
                            </label>
                            <div className="relative">
                              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <input
                                type="number"
                                required
                                min="1"
                                max="480"
                                value={formData.estimated_time_minutes}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, estimated_time_minutes: parseInt(e.target.value) || 1 }))
                                  // Si el usuario edita manualmente, desactivar el indicador de auto-calculado
                                  setAutoCalculatedTime(false)
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 ${formData.material_type === 'reading' && autoCalculatedTime
                                    ? 'border-[#00D4B3]/50 dark:border-[#00D4B3]/30'
                                    : 'border-[#E9ECEF] dark:border-[#6C757D]/30'
                                  }`}
                                placeholder="Ej: 15"
                              />
                            </div>
                            <p className="text-xs text-[#6C757D] dark:text-white/60 mt-1.5 ml-1">
                              {formData.material_type === 'reading' ? (
                                <>
                                  Para lecturas, el tiempo se calcula automáticamente basado en el conteo de palabras (180 ppm).
                                  <span className="block mt-1 text-[#00D4B3]/80">Puedes ajustarlo manualmente si lo deseas.</span>
                                </>
                              ) : (
                                <>
                                  Tiempo estimado para completar este material ({formData.material_type === 'quiz' ? 'completar quiz' : formData.material_type === 'link' ? 'revisar enlace' : 'revisar material'}). Mínimo 1 minuto, máximo 480 minutos (8 horas).
                                </>
                              )}
                              <span className="flex items-center gap-1.5 mt-1 text-[#00D4B3] font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Requerido para el Planificador de Estudio IA
                              </span>
                            </p>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={formData.is_downloadable}
                                  onChange={(e) => setFormData(prev => ({ ...prev, is_downloadable: e.target.checked }))}
                                  className="sr-only"
                                />
                                <motion.div
                                  animate={{
                                    backgroundColor: formData.is_downloadable ? '#00D4B3' : '#E9ECEF',
                                    borderColor: formData.is_downloadable ? '#00D4B3' : '#E9ECEF'
                                  }}
                                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
                                >
                                  {formData.is_downloadable && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    >
                                      <CheckCircleIcon className="h-4 w-4 text-white" />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-[#0A2540] dark:text-white">
                                  Permitir Descarga
                                </span>
                                <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                                  Los estudiantes podrán descargar este material
                                </p>
                              </div>
                            </label>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Tab: Contenido */}
                      {activeTab === 'content' && (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Contenido según tipo */}
                          {['pdf', 'document'].includes(formData.material_type) && (
                            <PDFUpload
                              value={formData.file_url}
                              onChange={(url) => setFormData(prev => ({ ...prev, file_url: url }))}
                            />
                          )}

                          {formData.material_type === 'quiz' && (
                            <QuizBuilder
                              questions={quizQuestions}
                              onChange={setQuizQuestions}
                            />
                          )}

                          {formData.material_type === 'link' && (
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                URL del Enlace *
                              </label>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="url"
                                  required={formData.material_type === 'link'}
                                  value={formData.external_url}
                                  onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                  placeholder="https://ejemplo.com/recurso"
                                />
                              </div>
                            </div>
                          )}

                          {formData.material_type === 'reading' && (
                            <ReadingContentEditor
                              value={formData.material_description}
                              onChange={(text, calculatedMinutes) => {
                                setFormData(prev => ({
                                  ...prev,
                                  material_description: text,
                                  estimated_time_minutes: calculatedMinutes
                                }))
                                setAutoCalculatedTime(true)
                              }}
                            />
                          )}

                          {formData.material_type === 'exercise' && (
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Instrucciones del Ejercicio
                              </label>
                              <textarea
                                rows={8}
                                value={formData.material_description}
                                onChange={(e) => setFormData(prev => ({ ...prev, material_description: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                                placeholder="Describe las instrucciones del ejercicio..."
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#E9ECEF]/30 dark:bg-[#0A0D12]">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 text-sm font-medium text-[#6C757D] dark:text-white/60 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-all duration-200"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Guardar</span>
                        </>
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
