'use client'

import { motion } from 'framer-motion'
import { FileText, Clock } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { QuizBuilder } from '../QuizBuilder'
import type { QuizQuestion } from '../QuizBuilder'
import type { MaterialFormData, MaterialType } from './useMaterialFormState'

// This file contains the "basic info" tab fields including type selector,
// estimated time, and the downloadable checkbox — plus the quiz tab content.
// Named VideoMaterialContent for consistency with the split plan spec, but
// it actually covers the non-PDF content types (quiz tab content + basic tab fields).

interface BasicTabFieldsProps {
  formData: MaterialFormData
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>
  autoCalculatedTime: boolean
  setAutoCalculatedTime: (value: boolean) => void
  MaterialTypeIcon: React.ComponentType<{ className?: string }>
}

export function BasicTabFields({
  formData, setFormData, autoCalculatedTime, setAutoCalculatedTime, MaterialTypeIcon
}: BasicTabFieldsProps) {
  return (
    <>
      <div className="group">
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
          Título del Material *
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
          <input
            type="text" required value={formData.material_title}
            onChange={(e) => setFormData(prev => ({ ...prev, material_title: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
            placeholder="Ej: Guía de Python"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
          Descripción
        </label>
        <textarea rows={3} value={formData.material_description}
          onChange={(e) => setFormData(prev => ({ ...prev, material_description: e.target.value }))}
          className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Descripción del material..."
        />
      </div>

      <div className="group">
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
          Tipo de Material *
        </label>
        <div className="relative">
          <MaterialTypeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
          <select
            value={formData.material_type}
            onChange={(e) => setFormData(prev => ({
              ...prev, material_type: e.target.value as MaterialType, file_url: '', external_url: ''
            }))}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
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
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide flex items-center gap-2">
          Tiempo Estimado (minutos) *
          {formData.material_type === 'reading' && autoCalculatedTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-medium rounded-full">
              <Sparkles className="w-3 h-3" /> Auto-calculado
            </span>
          )}
        </label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="number" required min="1" max="480"
            value={formData.estimated_time_minutes}
            onChange={(e) => {
              const nextValue = e.target.value.trim()
              setFormData(prev => ({
                ...prev,
                estimated_time_minutes: nextValue === '' ? '' : Number(nextValue),
              }))
              setAutoCalculatedTime(false)
            }}
            className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 ${
              formData.material_type === 'reading' && autoCalculatedTime ? 'border-accent/50 dark:border-accent/30' : 'border-gray-200 dark:border-gray-500/30'
            }`}
            placeholder="Ej: 15"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-white/60 mt-1.5 ml-1">
          {formData.material_type === 'reading' ? (
            <>Para lecturas, el tiempo se calcula automáticamente basado en el conteo de palabras (180 ppm).
              <span className="block mt-1 text-accent/80">Puedes ajustarlo manualmente si lo deseas.</span>
            </>
          ) : (
            <>Tiempo estimado para completar este material ({formData.material_type === 'quiz' ? 'completar quiz' : formData.material_type === 'link' ? 'revisar enlace' : 'revisar material'}). Mínimo 1 minuto, máximo 480 minutos (8 horas).</>
          )}
          {!autoCalculatedTime && formData.estimated_time_minutes === '' && (
            <span className="block mt-1 text-amber-600 dark:text-amber-400">
              Este material aun no tiene un tiempo guardado en la base de datos.
            </span>
          )}
          <span className="flex items-center gap-1.5 mt-1 text-accent font-medium">
            <Clock className="w-3.5 h-3.5" /> Requerido para el Planificador de Estudio IA
          </span>
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} className="p-4 bg-gray-200/50 dark:bg-carbon-950 rounded-xl border border-gray-200 dark:border-gray-500/30">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" checked={formData.is_downloadable}
              onChange={(e) => setFormData(prev => ({ ...prev, is_downloadable: e.target.checked }))}
              className="sr-only" />
            <motion.div
              animate={{ backgroundColor: formData.is_downloadable ? 'var(--color-accent)' : 'var(--color-gray-200)', borderColor: formData.is_downloadable ? 'var(--color-accent)' : 'var(--color-gray-200)' }}
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
            >
              {formData.is_downloadable && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          </div>
          <div>
            <span className="text-sm font-medium text-primary dark:text-white">Permitir Descarga</span>
            <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">Los estudiantes podrán descargar este material</p>
          </div>
        </label>
      </motion.div>
    </>
  )
}

// Quiz content for the 'content' tab
interface QuizContentProps {
  quizQuestions: QuizQuestion[]
  setQuizQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>
}

export function QuizContent({ quizQuestions, setQuizQuestions }: QuizContentProps) {
  return (
    <QuizBuilder questions={quizQuestions} onChange={setQuizQuestions} />
  )
}
