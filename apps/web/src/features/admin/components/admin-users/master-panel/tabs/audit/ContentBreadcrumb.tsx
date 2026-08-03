'use client'

import { BookOpen, Layers, PlayCircle, Route as RouteIcon } from 'lucide-react'

import type { ForensicContentContext } from '@/features/admin/services/user-forensics/user-forensics.types'

/**
 * Ubicación de un hecho dentro del contenido: curso › módulo › lección › actividad.
 *
 * Sin curso y módulo, "Lección 1.1" no le dice nada a quien audita: es la diferencia
 * entre un registro y una prueba. Se comparte entre la línea de tiempo y los bloqueos
 * para que ambos hablen el mismo idioma.
 */
export function ContentBreadcrumb({
  context,
}: {
  context?: ForensicContentContext | null
}) {
  if (!context) return null

  const parts = [
    { key: 'course', icon: <BookOpen className="h-3 w-3" />, label: context.courseTitle },
    { key: 'module', icon: <Layers className="h-3 w-3" />, label: context.moduleTitle },
    { key: 'lesson', icon: <PlayCircle className="h-3 w-3" />, label: context.lessonTitle },
    { key: 'activity', icon: <RouteIcon className="h-3 w-3" />, label: context.activityTitle },
  ].filter((part) => Boolean(part.label))

  if (parts.length === 0) return null

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
      {parts.map((part, index) => (
        <span key={part.key} className="flex items-center gap-1">
          {index > 0 ? <span className="text-gray-300 dark:text-gray-600">›</span> : null}
          <span className="text-gray-400 dark:text-gray-500">{part.icon}</span>
          <span className={index === 0 ? 'font-medium text-gray-600 dark:text-gray-300' : ''}>
            {part.label}
          </span>
        </span>
      ))}
    </p>
  )
}
