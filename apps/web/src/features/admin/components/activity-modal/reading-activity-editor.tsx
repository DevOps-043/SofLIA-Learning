import { useMemo } from 'react'
import { BookOpen, Clock, Sparkles, Type } from 'lucide-react'

import { calculateReadingTimeDetailed, READING_SPEEDS } from '@/lib/utils/readingTime'

import { labelTextClassName, textareaClassName } from './styles'

interface ReadingActivityEditorProps {
  estimatedMinutes: number | ''
  onChange: (nextValue: string, nextEstimatedMinutes: number) => void
  value: string
}

export function ReadingActivityEditor({
  estimatedMinutes,
  onChange,
  value,
}: ReadingActivityEditorProps) {
  const readingInfo = useMemo(
    () => calculateReadingTimeDetailed(value, 'slow'),
    [value],
  )

  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <span className={`flex items-center gap-2 ${labelTextClassName}`}>
          <BookOpen className="h-4 w-4 text-accent" />
          Contenido de la lectura
        </span>
        <textarea
          rows={12}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
              calculateReadingTimeDetailed(event.target.value, 'slow').estimatedMinutes,
            )
          }
          className={textareaClassName}
          placeholder="Pega o escribe el contenido completo de la lectura."
        />
      </label>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3">
        <ReadingMetric
          icon={<Type className="h-4 w-4 text-accent" />}
          label="Palabras"
          value={readingInfo.wordCount.toLocaleString()}
        />
        <ReadingMetric
          icon={<Clock className="h-4 w-4 text-accent" />}
          label="Tiempo estimado"
          value={estimatedMinutes === '' ? readingInfo.formattedTime : `${estimatedMinutes} min`}
        />
        <ReadingMetric
          icon={<Sparkles className="h-4 w-4 text-accent" />}
          label="Velocidad usada"
          value={`${READING_SPEEDS.slow.wordsPerMinute} ppm`}
        />
      </div>
      <p className="text-xs text-gray-600 dark:text-white/60">
        El tiempo estimado se actualiza automaticamente con una lectura reflexiva, igual que en materiales.
      </p>
    </div>
  )
}

function ReadingMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-600 dark:text-white/60">{label}</p>
        <p className="text-sm font-semibold text-primary dark:text-white">{value}</p>
      </div>
    </div>
  )
}
