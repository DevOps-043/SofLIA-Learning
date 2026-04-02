'use client'

import { motion } from 'framer-motion'
import { SparklesIcon } from '@heroicons/react/24/outline'
import type { LessonFormData } from './types'

interface LessonContentTabProps {
  formData: LessonFormData
  generatingAI: boolean
  onFormDataChange: (updater: (currentFormData: LessonFormData) => LessonFormData) => void
  onGenerateAI: () => void
}

export function LessonContentTab({
  formData,
  generatingAI,
  onFormDataChange,
  onGenerateAI,
}: LessonContentTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg text-white">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-[#0A2540] dark:text-white">
                Generación Automática
              </h4>
              <p className="text-xs text-[#6C757D] dark:text-white/70">
                Analiza el video subido para generar transcripción y resumen
                automáticamente con Gemini 2.0 Flash.
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={onGenerateAI}
            disabled={generatingAI || !formData.video_provider_id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generatingAI ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                <span>Generar con IA</span>
              </>
            )}
          </motion.button>
        </div>
        {(!formData.video_provider_id ||
          (formData.video_provider !== 'direct' &&
            formData.video_provider !== 'custom')) && (
          <p className="text-xs text-orange-500 mt-2 ml-1">
            * Requiere subir un video (Directo) o URL directa (Custom) primero.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
          Transcripción (Opcional)
        </label>
        <textarea
          rows={4}
          value={formData.transcript_content}
          onChange={(event) =>
            onFormDataChange((currentFormData) => ({
              ...currentFormData,
              transcript_content: event.target.value,
            }))
          }
          className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Transcripción del video..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
          Resumen (Opcional)
        </label>
        <textarea
          rows={4}
          value={formData.summary_content}
          onChange={(event) =>
            onFormDataChange((currentFormData) => ({
              ...currentFormData,
              summary_content: event.target.value,
            }))
          }
          className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Resumen del contenido del video..."
        />
        <p className="mt-1 text-xs text-[#6C757D] dark:text-white/60">
          Resumen breve del contenido de la lección. Se mostrará en la pestaña
          "Resumen" del curso.
        </p>
      </div>
    </div>
  )
}
