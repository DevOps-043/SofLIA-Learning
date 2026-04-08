import { normalizeContentForRenderer } from '@/lib/course-content'

import {
  defaultActivityValidationConfig,
  isSupportedExternalToolKey,
  normalizeActivityConfig,
  type ActivityChecklistItem,
  type ActivityConfig,
  type ActivityField,
  type ExternalToolKey,
} from '../types/activity-config'

const legacyInlineBlankPattern = /_{5,}/g
const legacyChecklistPattern = /^\[([\sxX])\]\s*(.+)$/
const externalToolMatchers: Array<{
  key: ExternalToolKey
  patterns: RegExp[]
}> = [
  { key: 'chatgpt', patterns: [/\bchatgpt\b/i] },
  { key: 'gemini', patterns: [/\bgemini\b/i] },
  { key: 'notebooklm', patterns: [/\bnotebook\s?lm\b/i] },
  { key: 'gamma', patterns: [/\bgamma\b/i] },
  { key: 'atlas', patterns: [/\batlas\b/i] },
]

type ResolveActivityConfigInput = {
  activityType?: string | null
  activityContent?: unknown
  rawActivityConfig?: unknown
  aiPrompts?: unknown
  requiresSofliaValidation?: boolean | null
  externalToolKey?: string | null
}

function parsePromptList(rawPrompts: unknown): string[] {
  if (Array.isArray(rawPrompts)) {
    return rawPrompts
      .map((prompt) => String(prompt).trim())
      .filter(Boolean)
  }

  if (typeof rawPrompts !== 'string') {
    return rawPrompts === null || rawPrompts === undefined
      ? []
      : [String(rawPrompts).trim()].filter(Boolean)
  }

  const trimmedPrompts = rawPrompts.trim()
  if (!trimmedPrompts) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmedPrompts)
    if (Array.isArray(parsed)) {
      return parsed
        .map((prompt) => String(prompt).trim())
        .filter(Boolean)
    }
  } catch {
    return trimmedPrompts
      .split('\n')
      .map((prompt) => prompt.trim())
      .filter(Boolean)
  }

  return [trimmedPrompts]
}

function normalizeExternalToolKey(value: unknown): ExternalToolKey | null {
  return isSupportedExternalToolKey(value) ? value : null
}

function detectExternalToolKeyFromText(value: string): ExternalToolKey | null {
  for (const matcher of externalToolMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(value))) {
      return matcher.key
    }
  }

  return null
}

function detectExternalToolKey(input: {
  activityContent: string
  aiPrompts: string[]
  rawExternalToolKey?: string | null
  rawConfig?: ActivityConfig | null
}): ExternalToolKey | null {
  const explicitToolKey =
    input.rawConfig?.toolTask?.toolKey ??
    normalizeExternalToolKey(input.rawExternalToolKey)

  if (explicitToolKey) {
    return explicitToolKey
  }

  const joinedPrompts = input.aiPrompts.join('\n')
  const fromPrompts = detectExternalToolKeyFromText(joinedPrompts)
  if (fromPrompts) {
    return fromPrompts
  }

  return detectExternalToolKeyFromText(input.activityContent)
}

function buildLegacyInlineAnswerFields(content: string): ActivityField[] {
  const fields: ActivityField[] = []
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  let fieldIndex = 0

  lines.forEach((line) => {
    const matches = line.match(legacyInlineBlankPattern)
    if (!matches) {
      return
    }

    const baseLabel = line.replace(legacyInlineBlankPattern, '_____').trim()
    matches.forEach((_match, matchIndex) => {
      const label =
        matches.length > 1
          ? `${baseLabel || 'Respuesta'} (${matchIndex + 1})`
          : baseLabel || `Respuesta ${fieldIndex + 1}`

      fields.push({
        id: `blank_${fieldIndex + 1}`,
        label,
        placeholder: 'Escribe tu respuesta',
        required: true,
        multiline: false,
      })

      fieldIndex += 1
    })
  })

  return fields
}

function buildLegacyChecklistItems(content: string): ActivityChecklistItem[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const match = line.match(legacyChecklistPattern)
      if (!match) {
        return []
      }

      return [
        {
          id: `check_${index + 1}`,
          label: match[2].trim(),
          required: true,
        } satisfies ActivityChecklistItem,
      ]
    })
}

function buildFallbackActivityConfig(content: string): ActivityConfig {
  const checklistItems = buildLegacyChecklistItems(content)
  if (checklistItems.length > 0) {
    return {
      interactionType: 'checklist',
      submission: {
        checklistItems,
      },
      validation: defaultActivityValidationConfig,
    }
  }

  const inlineAnswerFields = buildLegacyInlineAnswerFields(content)
  if (inlineAnswerFields.length > 0) {
    return {
      interactionType: 'inline_answers',
      submission: {
        fields: inlineAnswerFields,
      },
      validation: defaultActivityValidationConfig,
    }
  }

  return {
    interactionType: 'long_text',
    submission: {
      responsePlaceholder:
        'Escribe aqui tu respuesta, hallazgos o lo que realizaste en la actividad.',
      evidencePlaceholder:
        'Opcional: pega evidencia, enlaces o notas complementarias.',
    },
    validation: defaultActivityValidationConfig,
  }
}

function mergeToolTask(
  activityConfig: ActivityConfig,
  toolKey: ExternalToolKey | null,
  aiPrompts: string[],
): ActivityConfig {
  if (!toolKey) {
    return activityConfig
  }

  const currentPromptTemplate =
    activityConfig.toolTask?.promptTemplate || aiPrompts[0] || ''

  if (activityConfig.interactionType === 'external_tool_task') {
    return {
      ...activityConfig,
      toolTask: {
        toolKey,
        promptTemplate: currentPromptTemplate,
        openInNewTab: activityConfig.toolTask.openInNewTab,
        showCopyButton: activityConfig.toolTask.showCopyButton,
      },
    }
  }

  return {
    ...activityConfig,
    toolTask: {
      toolKey,
      promptTemplate: currentPromptTemplate,
      openInNewTab: true,
      showCopyButton: true,
    },
  }
}

function mergeValidationState(
  activityConfig: ActivityConfig,
  requiresSofliaValidation: boolean,
): ActivityConfig {
  if (!requiresSofliaValidation) {
    return activityConfig
  }

  return {
    ...activityConfig,
    validation: {
      ...activityConfig.validation,
      enabled: true,
    },
  }
}

export function isInteractiveLessonActivity(activityType?: string | null) {
  return activityType !== 'quiz' && activityType !== 'ai_chat'
}

export function resolveActivityConfig({
  activityType,
  activityContent,
  rawActivityConfig,
  aiPrompts,
  requiresSofliaValidation,
  externalToolKey,
}: ResolveActivityConfigInput): ActivityConfig | null {
  if (!isInteractiveLessonActivity(activityType)) {
    return null
  }

  const normalizedContent = normalizeContentForRenderer(activityContent)
  const normalizedPrompts = parsePromptList(aiPrompts)
  const parsedConfig = normalizeActivityConfig(rawActivityConfig)
  const detectedToolKey = detectExternalToolKey({
    activityContent: normalizedContent,
    aiPrompts: normalizedPrompts,
    rawExternalToolKey: externalToolKey,
    rawConfig: parsedConfig,
  })

  const activityConfig =
    parsedConfig ?? buildFallbackActivityConfig(normalizedContent)

  return mergeValidationState(
    mergeToolTask(activityConfig, detectedToolKey, normalizedPrompts),
    Boolean(requiresSofliaValidation),
  )
}
