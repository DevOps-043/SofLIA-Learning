'use client'

import { useState, useEffect } from 'react'
import { normalizeQuizQuestions as resolveQuizQuestions } from '@/lib/course-content'
import type {
  AdminMaterial,
  CreateMaterialData,
  UpdateMaterialData,
} from '../../services/adminMaterials.service'
import type { QuizQuestion } from '../QuizBuilder'

export type TabType = 'basic' | 'content'
export type MaterialType = AdminMaterial['material_type']

export interface MaterialFormData {
  material_title: string
  material_description: string
  material_type: MaterialType
  file_url: string
  external_url: string
  content_data: Record<string, unknown> | null
  is_downloadable: boolean
  estimated_time_minutes: number | ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!isRecord(value)) return false
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

export function getQuizQuestions(contentData: Record<string, unknown> | null): QuizQuestion[] {
  if (!isRecord(contentData) || !Array.isArray(contentData.questions)) return []
  // Resuelve correctAnswer (índices/letras/prefijos) y canoniza V/F al cargar,
  // para que el editor muestre la respuesta correcta seleccionada.
  const valid = contentData.questions.filter(isQuizQuestion)
  return resolveQuizQuestions(valid) as unknown as QuizQuestion[]
}

export function normalizeQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((question) => {
    if (question.questionType !== 'true_false') return question
    const options = question.options
    if (
      !options ||
      options.length !== 2 ||
      !['Verdadero', 'Falso'].includes(options[0]) ||
      !['Verdadero', 'Falso'].includes(options[1])
    ) {
      return { ...question, options: ['Verdadero', 'Falso'] }
    }
    return question
  })
}

interface UseMaterialFormStateProps {
  material?: AdminMaterial | null
  onSave: (data: CreateMaterialData | UpdateMaterialData) => Promise<void>
  onClose: () => void
}

export function useMaterialFormState({ material, onSave, onClose }: UseMaterialFormStateProps) {
  const [formData, setFormData] = useState<MaterialFormData>({
    material_title: '',
    material_description: '',
    material_type: 'pdf' as MaterialType,
    file_url: '',
    external_url: '',
    content_data: null,
    is_downloadable: false,
    estimated_time_minutes: 10
  })
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [autoCalculatedTime, setAutoCalculatedTime] = useState(false)

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
        estimated_time_minutes: material.estimated_time_minutes ?? ''
      })
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
      if (
        formData.estimated_time_minutes === '' ||
        formData.estimated_time_minutes < 1
      ) {
        throw new Error('El tiempo estimado debe ser mayor a 0.')
      }

      const dataToSave = { ...formData }
      if (formData.material_type === 'quiz') {
        dataToSave.content_data = {
          questions: quizQuestions,
          totalPoints: quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)
        }
      }

      await onSave({
        ...dataToSave,
        content_data: dataToSave.content_data ?? undefined,
        estimated_time_minutes: Number(formData.estimated_time_minutes),
      })
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar el material'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    setFormData,
    quizQuestions,
    setQuizQuestions,
    loading,
    error,
    activeTab,
    setActiveTab,
    autoCalculatedTime,
    setAutoCalculatedTime,
    handleSubmit
  }
}
