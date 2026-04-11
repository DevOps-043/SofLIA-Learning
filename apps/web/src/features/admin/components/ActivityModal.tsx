'use client'

import { useEffect, useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Plus, Trash2 } from 'lucide-react'
import { QuizBuilder, type QuizQuestion } from './QuizBuilder'
import { normalizeQuizQuestions } from './material-modal/useMaterialFormState'
import type {
  AdminActivity,
  CreateActivityData,
} from '../services/adminActivities.service'
import {
  activityConfigSchema,
  normalizeActivityConfig,
  supportedExternalToolKeys,
  type ActivityChecklistItem,
  type ActivityField,
  type ActivityInteractionType,
  type ActivityValidationRubricItem,
  type ExternalToolKey,
} from '@/features/courses/types/activity-config'
import { externalToolRegistry } from '@/features/courses/config/external-tool-registry'

interface ActivityModalProps {
  activity?: AdminActivity | null
  lessonId: string
  onClose: () => void
  onSave: (data: CreateActivityData) => Promise<void>
}

type ActivityType = AdminActivity['activity_type']
type TabKey = 'basic' | 'content' | 'interaction' | 'validation'

interface ActivityFormState {
  activity_title: string
  activity_description: string
  activity_type: ActivityType
  activity_content: string
  ai_prompts: string
  estimated_time_minutes: number | ''
  is_required: boolean
  requires_soflia_validation: boolean
}

const emptyFormState: ActivityFormState = {
  activity_title: '',
  activity_description: '',
  activity_type: 'reflection',
  activity_content: '',
  ai_prompts: '',
  estimated_time_minutes: 5,
  is_required: false,
  requires_soflia_validation: false,
}

const defaultField = (index: number): ActivityField => ({
  id: `field_${index}`,
  label: `Campo ${index}`,
  placeholder: '',
  required: true,
  multiline: false,
})

const defaultChecklistItem = (index: number): ActivityChecklistItem => ({
  id: `check_${index}`,
  label: `Paso ${index}`,
  description: '',
  required: true,
})

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'basic', label: 'Basica' },
  { id: 'content', label: 'Contenido' },
  { id: 'interaction', label: 'Interaccion' },
  { id: 'validation', label: 'Validacion' },
]

function parsePromptList(rawPrompts: string | null | undefined): string[] {
  if (!rawPrompts) return ['']
  try {
    const parsed = JSON.parse(rawPrompts)
    if (Array.isArray(parsed)) {
      const items = parsed.map((item) => String(item).trim()).filter(Boolean)
      return items.length > 0 ? items : ['']
    }
  } catch {}
  const items = rawPrompts.split('\n').map((item) => item.trim()).filter(Boolean)
  return items.length > 0 ? items : ['']
}

function parseQuizQuestions(rawContent: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(rawContent)
    if (Array.isArray(parsed)) return parsed as QuizQuestion[]
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
      return parsed.questions as QuizQuestion[]
    }
  } catch {}
  return []
}

function parseRubricText(items: ActivityValidationRubricItem[]): string {
  return items.map((item) => item.description?.trim() || item.label).join('\n')
}

export function ActivityModal({
  activity,
  lessonId: _lessonId,
  onClose,
  onSave,
}: ActivityModalProps) {
  const [form, setForm] = useState<ActivityFormState>(emptyFormState)
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiPrompts, setAiPrompts] = useState<string[]>([''])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [interactionType, setInteractionType] =
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

  const supportsInteractiveConfig =
    form.activity_type !== 'quiz' && form.activity_type !== 'ai_chat'

  const selectedToolLabel = useMemo(() => {
    if (!toolKey) return ''
    return externalToolRegistry[toolKey]?.label ?? toolKey
  }, [toolKey])

  useEffect(() => {
    if (!activity) {
      setForm(emptyFormState)
      setAiPrompts([''])
      setQuizQuestions([])
      setInteractionType('long_text')
      setResponsePlaceholder('')
      setEvidencePlaceholder('')
      setRequireEvidence(false)
      setMaxLength('')
      setFields([defaultField(1)])
      setChecklistItems([defaultChecklistItem(1)])
      setToolKey('')
      setPromptTemplate('')
      setOpenInNewTab(true)
      setShowCopyButton(true)
      setValidationEnabled(false)
      setRequiredForCompletion(false)
      setRubricText('')
      return
    }

    setForm({
      activity_title: activity.activity_title,
      activity_description: activity.activity_description || '',
      activity_type: activity.activity_type,
      activity_content: activity.activity_content,
      ai_prompts: activity.ai_prompts || '',
      estimated_time_minutes: activity.estimated_time_minutes ?? '',
      is_required: activity.is_required,
      requires_soflia_validation: activity.requires_soflia_validation,
    })
    setAiPrompts(parsePromptList(activity.ai_prompts))
    setQuizQuestions(normalizeQuizQuestions(parseQuizQuestions(activity.activity_content)))

    const config = normalizeActivityConfig(activity.activity_config)
    if (!config) return

    setInteractionType(config.interactionType)
    setResponsePlaceholder(config.submission.responsePlaceholder || '')
    setEvidencePlaceholder(config.submission.evidencePlaceholder || '')
    setRequireEvidence(Boolean(config.submission.requireEvidence))
    setMaxLength('maxLength' in config.submission ? config.submission.maxLength || '' : '')
    setFields(
      config.interactionType === 'inline_answers'
        ? config.submission.fields
        : [defaultField(1)],
    )
    setChecklistItems(
      config.interactionType === 'checklist'
        ? config.submission.checklistItems
        : [defaultChecklistItem(1)],
    )
    setToolKey(config.toolTask?.toolKey || '')
    setPromptTemplate(config.toolTask?.promptTemplate || '')
    setOpenInNewTab(config.toolTask?.openInNewTab ?? true)
    setShowCopyButton(config.toolTask?.showCopyButton ?? true)
    setValidationEnabled(config.validation.enabled)
    setRequiredForCompletion(config.validation.requiredForCompletion)
    setRubricText(parseRubricText(config.validation.rubric))
  }, [activity])

  const updateField = (index: number, key: keyof ActivityField, value: string | boolean) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field,
      ),
    )
  }

  const updateChecklistItem = (
    index: number,
    key: keyof ActivityChecklistItem,
    value: string | boolean,
  ) => {
    setChecklistItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    try {
      if (!form.activity_title.trim()) throw new Error('El titulo es obligatorio.')
      if (form.estimated_time_minutes === '' || form.estimated_time_minutes < 1) {
        throw new Error('El tiempo estimado debe ser mayor a 0.')
      }
      if (form.activity_type !== 'quiz' && !form.activity_content.trim()) {
        throw new Error('El contenido de la actividad es obligatorio.')
      }

      const payload: CreateActivityData = {
        activity_title: form.activity_title.trim(),
        activity_description: form.activity_description.trim(),
        activity_type: form.activity_type,
        activity_content: form.activity_content,
        ai_prompts: form.ai_prompts,
        estimated_time_minutes: Number(form.estimated_time_minutes),
        is_required: form.is_required,
        requires_soflia_validation: false,
        activity_schema_version: 1,
        external_tool_key: null,
        activity_config: null,
      }

      if (form.activity_type === 'quiz') {
        const normalizedQuestions = normalizeQuizQuestions(quizQuestions)
        if (normalizedQuestions.length === 0) {
          throw new Error('Agrega al menos una pregunta al quiz.')
        }
        payload.activity_content = JSON.stringify({
          questions: normalizedQuestions,
          totalPoints: normalizedQuestions.reduce((sum, item) => sum + (item.points || 1), 0),
        })
      } else if (form.activity_type === 'ai_chat') {
        const normalizedPrompts = aiPrompts.map((item) => item.trim()).filter(Boolean)
        if (normalizedPrompts.length === 0) {
          throw new Error('Agrega al menos un prompt para la actividad ai_chat.')
        }
        payload.ai_prompts = JSON.stringify(normalizedPrompts)
      } else {
        payload.requires_soflia_validation = validationEnabled
        payload.external_tool_key = toolKey || null

        const baseSubmission: Record<string, unknown> = {
          responsePlaceholder: responsePlaceholder.trim() || undefined,
          evidencePlaceholder: evidencePlaceholder.trim() || undefined,
          requireEvidence,
          ...(maxLength ? { maxLength: Number(maxLength) } : {}),
        }
        const rubric = rubricText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item, index) => ({ id: `rubric_${index + 1}`, label: item, description: item }))

        const baseConfig: Record<string, unknown> = {
          interactionType,
          submission: baseSubmission,
          validation: {
            enabled: validationEnabled,
            requiredForCompletion: validationEnabled && requiredForCompletion,
            rubric,
          },
          ...(toolKey
            ? {
                toolTask: {
                  toolKey,
                  promptTemplate,
                  openInNewTab,
                  showCopyButton,
                },
              }
            : {}),
        } as Record<string, unknown>

        if (interactionType === 'inline_answers') {
          const currentSubmission = baseConfig.submission as Record<string, unknown>
          baseConfig.submission = {
            ...currentSubmission,
            fields: fields.map((field, index) => ({
              ...field,
              id: field.id.trim() || `field_${index + 1}`,
              label: field.label.trim() || `Campo ${index + 1}`,
            })),
          }
        }

        if (interactionType === 'checklist') {
          baseConfig.submission = {
            checklistItems: checklistItems.map((item, index) => ({
              ...item,
              id: item.id.trim() || `check_${index + 1}`,
              label: item.label.trim() || `Paso ${index + 1}`,
            })),
            responsePlaceholder: responsePlaceholder.trim() || undefined,
            evidencePlaceholder: evidencePlaceholder.trim() || undefined,
            requireEvidence,
          }
        }

        if (interactionType === 'external_tool_task' && !toolKey) {
          throw new Error('Selecciona la herramienta externa para esta actividad.')
        }

        payload.activity_config = activityConfigSchema.parse(baseConfig)
      }

      setLoading(true)
      await onSave(payload)
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la actividad.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
        <div className="flex items-center justify-between border-b border-[#E9ECEF] bg-[#0A2540] px-6 py-4 dark:border-[#6C757D]/30">
          <div>
            <h3 className="text-lg font-bold text-white">{activity ? 'Editar actividad' : 'Crear actividad'}</h3>
            <p className="text-sm text-white/70">Configura contenido, interaccion y validacion.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 border-b border-[#E9ECEF] px-6 py-3 dark:border-[#6C757D]/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === tab.id ? 'bg-[#00D4B3]/15 text-[#0A2540] dark:text-white' : 'text-[#6C757D] dark:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}

            {activeTab === 'basic' && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#0A2540] dark:text-white">Titulo</span>
                  <input
                    type="text"
                    value={form.activity_title}
                    onChange={(event) => setForm((current) => ({ ...current, activity_title: event.target.value }))}
                    className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                    placeholder="Ej: Analiza y valida esta noticia"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#0A2540] dark:text-white">Descripcion</span>
                  <textarea
                    rows={3}
                    value={form.activity_description}
                    onChange={(event) => setForm((current) => ({ ...current, activity_description: event.target.value }))}
                    className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                    placeholder="Contexto opcional para el autor y para SofLIA."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#0A2540] dark:text-white">Tipo de actividad</span>
                  <select
                    value={form.activity_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        activity_type: event.target.value as ActivityType,
                      }))
                    }
                    className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                  >
                    <option value="reflection">Reflexion</option>
                    <option value="exercise">Ejercicio</option>
                    <option value="quiz">Quiz</option>
                    <option value="discussion">Discusion</option>
                    <option value="ai_chat">Chat con IA</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#0A2540] dark:text-white">Tiempo estimado (min)</span>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={form.estimated_time_minutes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        estimated_time_minutes:
                          event.target.value.trim() === ''
                            ? ''
                            : Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                  />
                  {form.estimated_time_minutes === '' ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Esta actividad aun no tiene un tiempo guardado en la base de datos.
                    </p>
                  ) : null}
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-[#D0D7DE] p-4 text-sm dark:border-[#6C757D]/30 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.is_required}
                    onChange={(event) => setForm((current) => ({ ...current, is_required: event.target.checked }))}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="text-[#0A2540] dark:text-white">
                    Marcar como requerida para que el alumno deba completarla antes de avanzar.
                  </span>
                </label>
                {!supportsInteractiveConfig ? (
                  <div className="rounded-xl border border-[#D0D7DE] bg-[#F8FAFC] px-4 py-3 text-sm text-[#52606D] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white/70 md:col-span-2">
                    {form.activity_type === 'quiz'
                      ? 'Los quizzes mantienen su flujo actual y se configuran desde el contenido del quiz.'
                      : 'Las actividades ai_chat mantienen su flujo actual y usan prompts estructurados.'}
                  </div>
                ) : null}
              </div>
            )}
            {activeTab === 'content' && (
              <div className="space-y-4">
                {form.activity_type !== 'quiz' ? (
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[#0A2540] dark:text-white">Contenido renderizado</span>
                    <textarea
                      rows={10}
                      value={form.activity_content}
                      onChange={(event) => setForm((current) => ({ ...current, activity_content: event.target.value }))}
                      className="w-full rounded-xl border border-[#D0D7DE] px-4 py-3 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                      placeholder="Instrucciones, contexto y texto rico de la actividad."
                    />
                  </label>
                ) : null}

                {form.activity_type === 'quiz' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[#52606D] dark:text-white/70">
                      El quiz se guarda como JSON estructurado en `activity_content`.
                    </p>
                    <QuizBuilder questions={quizQuestions} onChange={setQuizQuestions} />
                  </div>
                ) : null}

                {form.activity_type === 'ai_chat' ? (
                  <div className="space-y-3 rounded-xl border border-[#D0D7DE] p-4 dark:border-[#6C757D]/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#0A2540] dark:text-white">Prompts para la actividad</p>
                        <p className="text-xs text-[#52606D] dark:text-white/60">Se guardan como arreglo JSON.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiPrompts((current) => [...current, ''])}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D0D7DE] px-3 py-1.5 text-xs font-medium text-[#0A2540] dark:border-[#6C757D]/30 dark:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar prompt
                      </button>
                    </div>
                    {aiPrompts.map((prompt, index) => (
                      <div key={`prompt-${index}`} className="flex items-start gap-2">
                        <textarea
                          rows={3}
                          value={prompt}
                          onChange={(event) =>
                            setAiPrompts((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? event.target.value : item,
                              ),
                            )
                          }
                          className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                          placeholder={`Prompt ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAiPrompts((current) =>
                              current.length === 1 ? [''] : current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 dark:border-red-900/40 dark:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
            {activeTab === 'interaction' && (
              <div className="space-y-4">
                {!supportsInteractiveConfig ? (
                  <div className="rounded-xl border border-[#D0D7DE] bg-[#F8FAFC] px-4 py-3 text-sm text-[#52606D] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white/70">
                    Esta actividad conserva su flujo actual y no usa `activity_config`.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0A2540] dark:text-white">Tipo de interaccion</span>
                        <select
                          value={interactionType}
                          onChange={(event) => setInteractionType(event.target.value as ActivityInteractionType)}
                          className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                        >
                          <option value="long_text">Long text</option>
                          <option value="inline_answers">Inline answers</option>
                          <option value="checklist">Checklist</option>
                          <option value="external_tool_task">External tool task</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0A2540] dark:text-white">Maximo de caracteres</span>
                        <input
                          type="number"
                          min={1}
                          value={maxLength}
                          onChange={(event) => setMaxLength(event.target.value ? Number(event.target.value) : '')}
                          className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                          placeholder="Opcional"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0A2540] dark:text-white">Placeholder de respuesta</span>
                        <input
                          type="text"
                          value={responsePlaceholder}
                          onChange={(event) => setResponsePlaceholder(event.target.value)}
                          className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0A2540] dark:text-white">Placeholder de evidencia</span>
                        <input
                          type="text"
                          value={evidencePlaceholder}
                          onChange={(event) => setEvidencePlaceholder(event.target.value)}
                          className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                        />
                      </label>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-[#D0D7DE] p-4 text-sm dark:border-[#6C757D]/30">
                      <input
                        type="checkbox"
                        checked={requireEvidence}
                        onChange={(event) => setRequireEvidence(event.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className="text-[#0A2540] dark:text-white">
                        Solicitar evidencia adicional del usuario en esta actividad.
                      </span>
                    </label>

                    {(interactionType === 'inline_answers' || interactionType === 'checklist') && (
                      <div className="space-y-3 rounded-xl border border-[#D0D7DE] p-4 dark:border-[#6C757D]/30">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                            {interactionType === 'inline_answers' ? 'Campos inline' : 'Items del checklist'}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              interactionType === 'inline_answers'
                                ? setFields((current) => [...current, defaultField(current.length + 1)])
                                : setChecklistItems((current) => [...current, defaultChecklistItem(current.length + 1)])
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D0D7DE] px-3 py-1.5 text-xs font-medium text-[#0A2540] dark:border-[#6C757D]/30 dark:text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                          </button>
                        </div>

                        {interactionType === 'inline_answers' &&
                          fields.map((field, index) => (
                            <div key={field.id || `field-${index}`} className="grid gap-3 rounded-xl border border-[#E9ECEF] p-3 dark:border-[#6C757D]/20 md:grid-cols-2">
                              <input
                                type="text"
                                value={field.label}
                                onChange={(event) => updateField(index, 'label', event.target.value)}
                                className="rounded-lg border border-[#D0D7DE] px-3 py-2 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                                placeholder="Etiqueta"
                              />
                              <input
                                type="text"
                                value={field.id}
                                onChange={(event) => updateField(index, 'id', event.target.value)}
                                className="rounded-lg border border-[#D0D7DE] px-3 py-2 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                                placeholder="field_id"
                              />
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(event) => updateField(index, 'placeholder', event.target.value)}
                                className="rounded-lg border border-[#D0D7DE] px-3 py-2 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                                placeholder="Placeholder"
                              />
                              <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm text-[#0A2540] dark:text-white">
                                  <input type="checkbox" checked={field.required} onChange={(event) => updateField(index, 'required', event.target.checked)} />
                                  Requerido
                                </label>
                                <label className="flex items-center gap-2 text-sm text-[#0A2540] dark:text-white">
                                  <input type="checkbox" checked={field.multiline} onChange={(event) => updateField(index, 'multiline', event.target.checked)} />
                                  Multilinea
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setFields((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)))}
                                  className="rounded-lg border border-red-200 p-2 text-red-600 dark:border-red-900/40 dark:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                        {interactionType === 'checklist' &&
                          checklistItems.map((item, index) => (
                            <div key={item.id || `check-${index}`} className="grid gap-3 rounded-xl border border-[#E9ECEF] p-3 dark:border-[#6C757D]/20 md:grid-cols-2">
                              <input
                                type="text"
                                value={item.label}
                                onChange={(event) => updateChecklistItem(index, 'label', event.target.value)}
                                className="rounded-lg border border-[#D0D7DE] px-3 py-2 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                                placeholder="Label"
                              />
                              <input
                                type="text"
                                value={item.id}
                                onChange={(event) => updateChecklistItem(index, 'id', event.target.value)}
                                className="rounded-lg border border-[#D0D7DE] px-3 py-2 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                                placeholder="check_id"
                              />
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(event) => updateChecklistItem(index, 'description', event.target.value)}
                                className="rounded-lg border border-[#D0D7DE] px-3 py-2 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white md:col-span-2"
                                placeholder="Descripcion opcional"
                              />
                              <div className="flex items-center justify-between gap-3 md:col-span-2">
                                <label className="flex items-center gap-2 text-sm text-[#0A2540] dark:text-white">
                                  <input type="checkbox" checked={item.required} onChange={(event) => updateChecklistItem(index, 'required', event.target.checked)} />
                                  Requerido
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setChecklistItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)))}
                                  className="rounded-lg border border-red-200 p-2 text-red-600 dark:border-red-900/40 dark:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="space-y-3 rounded-xl border border-[#D0D7DE] p-4 dark:border-[#6C757D]/30">
                      <div>
                        <p className="text-sm font-medium text-[#0A2540] dark:text-white">Herramienta externa</p>
                        <p className="text-xs text-[#52606D] dark:text-white/60">Registro central soportado en v1.</p>
                      </div>
                      <select
                        value={toolKey}
                        onChange={(event) => setToolKey(event.target.value as ExternalToolKey | '')}
                        className="w-full rounded-xl border border-[#D0D7DE] px-4 py-2.5 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                      >
                        <option value="">Sin herramienta externa</option>
                        {supportedExternalToolKeys.map((item) => (
                          <option key={item} value={item}>
                            {externalToolRegistry[item].label}
                          </option>
                        ))}
                      </select>
                      {toolKey ? (
                        <>
                          <textarea
                            rows={6}
                            value={promptTemplate}
                            onChange={(event) => setPromptTemplate(event.target.value)}
                            className="w-full rounded-xl border border-[#D0D7DE] px-4 py-3 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                            placeholder={`Prompt base para ${selectedToolLabel}`}
                          />
                          <div className="flex flex-wrap gap-4 text-sm text-[#0A2540] dark:text-white">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={openInNewTab} onChange={(event) => setOpenInNewTab(event.target.checked)} />
                              Abrir en nueva pestaña
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={showCopyButton} onChange={(event) => setShowCopyButton(event.target.checked)} />
                              Mostrar boton copiar
                            </label>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === 'validation' && (
              <div className="space-y-4">
                {!supportsInteractiveConfig ? (
                  <div className="rounded-xl border border-[#D0D7DE] bg-[#F8FAFC] px-4 py-3 text-sm text-[#52606D] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white/70">
                    La validacion estructurada con SofLIA aplica en esta fase solo para actividades interactivas basadas en `activity_config`.
                  </div>
                ) : (
                  <>
                    <label className="flex items-start gap-3 rounded-xl border border-[#D0D7DE] p-4 text-sm dark:border-[#6C757D]/30">
                      <input
                        type="checkbox"
                        checked={validationEnabled}
                        onChange={(event) => {
                          setValidationEnabled(event.target.checked)
                          if (!event.target.checked) {
                            setRequiredForCompletion(false)
                          }
                        }}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className="text-[#0A2540] dark:text-white">
                        Habilitar validacion con SofLIA para esta actividad.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[#D0D7DE] p-4 text-sm dark:border-[#6C757D]/30">
                      <input
                        type="checkbox"
                        checked={requiredForCompletion}
                        disabled={!validationEnabled}
                        onChange={(event) => setRequiredForCompletion(event.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className={`${validationEnabled ? 'text-[#0A2540] dark:text-white' : 'text-[#94A3B8] dark:text-white/40'}`}>
                        Exigir resultado `pass` para completar la leccion.
                      </span>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[#0A2540] dark:text-white">Rubrica</span>
                      <textarea
                        rows={8}
                        value={rubricText}
                        onChange={(event) => setRubricText(event.target.value)}
                        className="w-full rounded-xl border border-[#D0D7DE] px-4 py-3 text-sm text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white"
                        placeholder={'Un criterio por linea.\nEj: Verifica si eligio la herramienta correcta.\nEj: Explica con una razon breve y precisa.'}
                      />
                    </label>
                    <div className="rounded-xl border border-[#D0D7DE] bg-[#F8FAFC] px-4 py-3 text-sm text-[#52606D] dark:border-[#6C757D]/30 dark:bg-[#0A0D12] dark:text-white/70">
                      SofLIA devolvera `pass`, `revise` o `error`, junto con resumen, fortalezas, mejoras y siguiente paso sugerido.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-[#E9ECEF] bg-[#F8FAFC] px-6 py-4 dark:border-[#6C757D]/30 dark:bg-[#0A0D12]">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#D0D7DE] px-4 py-2 text-sm font-medium text-[#6C757D] dark:border-[#6C757D]/30 dark:text-white/70">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
