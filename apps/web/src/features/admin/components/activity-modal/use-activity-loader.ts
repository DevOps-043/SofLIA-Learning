import { useEffect } from 'react'
import { normalizeActivityConfig } from '@/features/courses/types/activity-config'

import type { AdminActivity } from '../../services/adminActivities.service'
import { normalizeQuizQuestions } from '../material-modal/useMaterialFormState'
import { defaultChecklistItem, defaultField, emptyFormState } from './defaults'
import { parsePromptList, parseQuizQuestions, parseRubricText } from './parsers'
import type { ActivityEditorState } from './use-activity-editor-state'

export function useActivityLoader(
  activity: AdminActivity | null | undefined,
  state: ActivityEditorState,
) {
  useEffect(() => {
    if (!activity) {
      resetActivityState(state)
      return
    }
    state.setForm({
      activity_title: activity.activity_title,
      activity_description: activity.activity_description || '',
      activity_type: activity.activity_type,
      activity_content: activity.activity_content,
      ai_prompts: activity.ai_prompts || '',
      estimated_time_minutes: activity.estimated_time_minutes ?? '',
      is_required: activity.is_required,
      requires_soflia_validation: activity.requires_soflia_validation,
    })
    state.setAiPrompts(parsePromptList(activity.ai_prompts))
    state.setQuizQuestions(normalizeQuizQuestions(parseQuizQuestions(activity.activity_content)))

    const config = normalizeActivityConfig(activity.activity_config)
    if (!config || config.interactionType === 'soflia_dialogue') return

    state.setInteractionType(config.interactionType)
    state.setResponsePlaceholder(config.submission.responsePlaceholder || '')
    state.setEvidencePlaceholder(config.submission.evidencePlaceholder || '')
    state.setRequireEvidence(Boolean(config.submission.requireEvidence))
    state.setMaxLength('maxLength' in config.submission ? config.submission.maxLength || '' : '')
    state.setFields(config.interactionType === 'inline_answers' ? config.submission.fields : [defaultField(1)])
    state.setChecklistItems(
      config.interactionType === 'checklist'
        ? config.submission.checklistItems
        : [defaultChecklistItem(1)],
    )
    state.setToolKey(config.toolTask?.toolKey || '')
    state.setPromptTemplate(config.toolTask?.promptTemplate || '')
    state.setOpenInNewTab(config.toolTask?.openInNewTab ?? true)
    state.setShowCopyButton(config.toolTask?.showCopyButton ?? true)
    state.setValidationEnabled(config.validation.enabled)
    state.setRequiredForCompletion(config.validation.requiredForCompletion)
    state.setRubricText(parseRubricText(config.validation.rubric))
  }, [activity])
}

function resetActivityState(state: ActivityEditorState) {
  state.setForm(emptyFormState)
  state.setAiPrompts([''])
  state.setQuizQuestions([])
  state.setInteractionType('long_text')
  state.setResponsePlaceholder('')
  state.setEvidencePlaceholder('')
  state.setRequireEvidence(false)
  state.setMaxLength('')
  state.setFields([defaultField(1)])
  state.setChecklistItems([defaultChecklistItem(1)])
  state.setToolKey('')
  state.setPromptTemplate('')
  state.setOpenInNewTab(true)
  state.setShowCopyButton(true)
  state.setValidationEnabled(false)
  state.setRequiredForCompletion(false)
  state.setRubricText('')
}
