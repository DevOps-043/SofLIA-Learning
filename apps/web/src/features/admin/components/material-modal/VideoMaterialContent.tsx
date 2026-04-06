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
        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
          Título del Material *
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
          <input
            type="text" required value={formData.material_title}
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
        <textarea rows={3} value={formData.material_description}
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
              ...prev, material_type: e.target.value as MaterialType, file_url: '', external_url: ''
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
              <Sparkles className="w-3 h-3" /> Auto-calculado
            </span>
          )}
        </label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="number" required min="1" max="480"
            value={formData.estimated_time_minutes}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, estimated_time_minutes: parseInt(e.target.value) || 1 }))
              setAutoCalculatedTime(false)
            }}
            className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 ${
              formData.material_type === 'reading' && autoCalculatedTime ? 'border-[#00D4B3]/50 dark:border-[#00D4B3]/30' : 'border-[#E9ECEF] dark:border-[#6C757D]/30'
            }`}
            placeholder="Ej: 15"
          />
        </div>
        <p className="text-xs text-[#6C757D] dark:text-white/60 mt-1.5 ml-1">
          {formData.material_type === 'reading' ? (
            <>Para lecturas, el tiempo se calcula automáticamente basado en el conteo de palabras (180 ppm).
              <span className="block mt-1 text-[#00D4B3]/80">Puedes ajustarlo manualmente si lo deseas.</span>
            </>
          ) : (
            <>Tiempo estimado para completar este material ({formData.material_type === 'quiz' ? 'completar quiz' : formData.material_type === 'link' ? 'revisar enlace' : 'revisar material'}). Mínimo 1 minuto, máximo 480 minutos (8 horas).</>
          )}
          <span className="flex items-center gap-1.5 mt-1 text-[#00D4B3] font-medium">
            <Clock className="w-3.5 h-3.5" /> Requerido para el Planificador de Estudio IA
          </span>
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" checked={formData.is_downloadable}
              onChange={(e) => setFormData(prev => ({ ...prev, is_downloadable: e.target.checked }))}
              className="sr-only" />
            <motion.div
              animate={{ backgroundColor: formData.is_downloadable ? '#00D4B3' : '#E9ECEF', borderColor: formData.is_downloadable ? '#00D4B3' : '#E9ECEF' }}
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
            <span className="text-sm font-medium text-[#0A2540] dark:text-white">Permitir Descarga</span>
            <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">Los estudiantes podrán descargar este material</p>
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
