import { useCallback, useState } from 'react'
import type {
  ActivityChecklistItem,
  ActivityField,
  ActivityInteractionType,
  ExternalToolKey,
} from '@/features/courses/types/activity-config'

import type { QuizQuestion } from '../QuizBuilder'
import { defaultChecklistItem, defaultField, emptyFormState } from './defaults'
import type { TabKey } from './types'

export function useActivityEditorState() {
  const [form, setForm] = useState(emptyFormState)
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiPrompts, setAiPrompts] = useState<string[]>([''])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [interactionType, setInteractionTypeState] =
    useState<ActivityInteractionType>('long_text')
  const [responsePlaceholder, setResponsePlaceholder] = useState('')
  const [evidencePlaceholder, setEvidencePlaceholder] = useState('')
  const [requireEvidence, setRequireEvidence] = useState(false)
  const [maxLength, setMaxLength] = useState<number | ''>('')
  const [fields, setFields] = useState<ActivityField[]>([defaultField(1)])
  const [checklistItems, setChecklistItems] = useState<ActivityChecklistItem[]>([
    defaultChecklistItem(1),
  ])
  const [toolKey, setToolKey] = useState<ExternalToolKey | ''>('')
  const [promptTemplate, setPromptTemplate] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [showCopyButton, setShowCopyButton] = useState(true)
  const [validationEnabled, setValidationEnabled] = useState(false)
  const [requiredForCompletion, setRequiredForCompletion] = useState(false)
  const [rubricText, setRubricText] = useState('')

  // Al elegir SofLIA Dialogue, marcar la actividad como requerida por defecto: estas
  // actividades gatean el avance (evaluación >= 60%). El admin puede desmarcarlo, pero
  // el runtime igualmente las trata como requeridas por diseño.
  const setInteractionType = useCallback((next: ActivityInteractionType) => {
    setInteractionTypeState(next)
    if (next === 'soflia_dialogue') {
      setForm((current) =>
        current.is_required ? current : { ...current, is_required: true },
      )
    }
  }, [])

  return {
    activeTab,
    aiPrompts,
    checklistItems,
    error,
    evidencePlaceholder,
    fields,
    form,
    interactionType,
    loading,
    maxLength,
    openInNewTab,
    promptTemplate,
    quizQuestions,
    requireEvidence,
    requiredForCompletion,
    responsePlaceholder,
    rubricText,
    setActiveTab,
    setAiPrompts,
    setChecklistItems,
    setError,
    setEvidencePlaceholder,
    setFields,
    setForm,
    setInteractionType,
    setLoading,
    setMaxLength,
    setOpenInNewTab,
    setPromptTemplate,
    setQuizQuestions,
    setRequireEvidence,
    setRequiredForCompletion,
    setResponsePlaceholder,
    setRubricText,
    setShowCopyButton,
    setToolKey,
    setValidationEnabled,
    showCopyButton,
    toolKey,
    validationEnabled,
  }
}

export type ActivityEditorState = ReturnType<typeof useActivityEditorState>
