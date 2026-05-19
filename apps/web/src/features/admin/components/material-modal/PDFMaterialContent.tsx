'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link as LinkIcon, BookOpen } from 'lucide-react'
import { Clock, Sparkles, Type } from 'lucide-react'
import { PDFUpload } from '../PDFUpload'
import { calculateReadingTimeDetailed, READING_SPEEDS } from '@/lib/utils/readingTime'
import type { MaterialFormData } from './useMaterialFormState'

// ──────────────────────────────────────────────────────────────
// ReadingContentEditor (inner helper, only used inside this file)
// ──────────────────────────────────────────────────────────────
interface ReadingContentEditorProps {
  value: string
  onChange: (text: string, calculatedMinutes: number) => void
}

function ReadingContentEditor({ value, onChange }: ReadingContentEditorProps) {
  const [localValue, setLocalValue] = useState(value)

  const readingInfo = useMemo(() => calculateReadingTimeDetailed(localValue, 'slow'), [localValue])

  useEffect(() => { setLocalValue(value) }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setLocalValue(newText)
    const info = calculateReadingTimeDetailed(newText, 'slow')
    onChange(newText, info.estimatedMinutes)
  }, [onChange])

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
        Contenido de Lectura
      </label>
      <div className="relative">
        <textarea
          rows={10} value={localValue} onChange={handleChange}
          className="w-full px-4 py-3 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
          placeholder="Pega o escribe el contenido de la lectura aquí. El tiempo estimado se calculará automáticamente..."
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4 p-3 bg-gradient-to-r from-accent/10 to-primary/10 dark:from-accent/20 dark:to-primary/20 rounded-xl border border-accent/20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Type className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-white/60">Palabras</p>
            <p className="text-sm font-bold text-primary dark:text-white">{readingInfo.wordCount.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-500/30" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-white/60">Tiempo Estimado</p>
            <p className="text-sm font-bold text-primary dark:text-white">{readingInfo.formattedTime}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-500/30" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-white/60">Velocidad</p>
            <p className="text-xs font-medium text-primary dark:text-white/80">
              {READING_SPEEDS.slow.wordsPerMinute} ppm (lectura reflexiva)
            </p>
          </div>
        </div>
      </motion.div>
      <p className="text-xs text-gray-500 dark:text-white/50 flex items-start gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
        <span>
          El tiempo se calcula automáticamente usando una velocidad de lectura reflexiva (180 palabras/min),
          ideal para contenido educativo que requiere comprensión profunda.
        </span>
      </p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// PDFMaterialContent – used for tab 'content' for pdf/document/link/reading/exercise
// ──────────────────────────────────────────────────────────────
interface PDFMaterialContentProps {
  formData: MaterialFormData
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>
  setAutoCalculatedTime: (value: boolean) => void
}

export function PDFMaterialContent({ formData, setFormData, setAutoCalculatedTime }: PDFMaterialContentProps) {
  return (
    <>
      {['pdf', 'document'].includes(formData.material_type) && (
        <PDFUpload
          value={formData.file_url}
          onChange={(url) => setFormData(prev => ({ ...prev, file_url: url }))}
        />
      )}

      {formData.material_type === 'link' && (
        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            URL del Enlace *
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="url" required={formData.material_type === 'link'}
              value={formData.external_url}
              onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
              placeholder="https://ejemplo.com/recurso"
            />
          </div>
        </div>
      )}

      {formData.material_type === 'reading' && (
        <ReadingContentEditor
          value={formData.material_description}
          onChange={(text, calculatedMinutes) => {
            setFormData(prev => ({ ...prev, material_description: text, estimated_time_minutes: calculatedMinutes }))
            setAutoCalculatedTime(true)
          }}
        />
      )}

      {formData.material_type === 'exercise' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            Instrucciones del Ejercicio
          </label>
          <textarea
            rows={8} value={formData.material_description}
            onChange={(e) => setFormData(prev => ({ ...prev, material_description: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Describe las instrucciones del ejercicio..."
          />
        </div>
      )}
    </>
  )
}
