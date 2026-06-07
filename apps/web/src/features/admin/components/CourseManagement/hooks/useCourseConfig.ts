'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CourseSkill } from '../../../../courses/components/CourseSkillsSelector'
import type { ConfigData, CourseWorkshopPreview } from '../types'
import { DEFAULT_CONFIG_DATA } from '../types'

export function useCourseConfig(
  courseId: string,
  isNewCourse: boolean,
  router: ReturnType<typeof useRouter>,
  workshopPreview: CourseWorkshopPreview | null,
  showFeedback: (type: 'success' | 'error', message: string) => void
) {
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [configData, setConfigData] = useState<ConfigData>(DEFAULT_CONFIG_DATA)
  const [courseSkills, setCourseSkills] = useState<CourseSkill[]>([])
  const [savingSkills, setSavingSkills] = useState(false)

  // Populate config form when workshop preview is loaded
  useEffect(() => {
    if (workshopPreview) {
      setConfigData({
        title: workshopPreview.title || '',
        description: workshopPreview.description || '',
        category: workshopPreview.category || 'ia',
        level: workshopPreview.level || 'beginner',
        duration_total_minutes: workshopPreview.duration_total_minutes || 60,
        price: workshopPreview.price || 0,
        thumbnail_url: workshopPreview.thumbnail_url || '',
        slug: workshopPreview.slug || '',
        instructor_id: workshopPreview.instructor_id || '',
      })
    }
  }, [workshopPreview])

  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setConfigData(prev => ({
      ...prev,
      [name]:
        name === 'price' || name === 'duration_total_minutes' ? Number(value) : value,
    }))
  }

  const handleSaveSkills = async () => {
    try {
      setSavingSkills(true)
      const res = await fetch(`/api/courses/${courseId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: courseSkills }),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al guardar skills')
      }
    } catch (err) {
      techDebtLogger.error('Error saving skills:', err)
      throw err
    } finally {
      setSavingSkills(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingConfig(true)

      const url = isNewCourse ? '/api/admin/workshops/create' : `/api/admin/workshops/${courseId}`
      const method = isNewCourse ? 'POST' : 'PUT'

      if (!configData.instructor_id && isNewCourse) {
        throw new Error('Debes seleccionar un instructor')
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors
            .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
            .join('\n')
          throw new Error(`Errores de validación:\n${errorMessages}`)
        }
        throw new Error(data?.error || data?.message || 'Error al guardar la configuración')
      }

      if (isNewCourse) {
        const data = await res.json()
        if (data.workshop?.id) {
          showFeedback('success', 'Curso creado correctamente. Redirigiendo...')
          router.replace(`/admin/workshops/${data.workshop.id}`)
          return
        }
      }

      await handleSaveSkills()
      showFeedback('success', 'Configuración guardada correctamente')
    } catch (err) {
      showFeedback(
        'error',
        err instanceof Error ? err.message : 'Error al guardar la configuración'
      )
    } finally {
      setSavingConfig(false)
    }
  }

  return {
    savingConfig,
    configData,
    setConfigData,
    handleConfigChange,
    handleSaveConfig,
    courseSkills,
    setCourseSkills,
    savingSkills,
  }
}
