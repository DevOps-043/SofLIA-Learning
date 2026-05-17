import {
  defaultActivityValidationConfig,
  type ActivityChecklistItem,
  type ActivityConfig,
  type ActivityField,
} from '../../types/activity-config'

const legacyInlineBlankPattern = /_{5,}/g
const legacyChecklistPattern = /^\[([\sxX])\]\s*(.+)$/

function buildLegacyInlineAnswerFields(content: string): ActivityField[] {
  const fields: ActivityField[] = []
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean)
  let fieldIndex = 0

  lines.forEach((line) => {
    const matches = line.match(legacyInlineBlankPattern)
    if (!matches) return

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
      return match
        ? [{ id: `check_${index + 1}`, label: match[2].trim(), required: true }]
        : []
    })
}

export function buildFallbackActivityConfig(content: string): ActivityConfig {
  const checklistItems = buildLegacyChecklistItems(content)
  if (checklistItems.length > 0) {
    return {
      interactionType: 'checklist',
      submission: { checklistItems },
      validation: defaultActivityValidationConfig,
    }
  }

  const fields = buildLegacyInlineAnswerFields(content)
  if (fields.length > 0) {
    return {
      interactionType: 'inline_answers',
      submission: { fields },
      validation: defaultActivityValidationConfig,
    }
  }

  return {
    interactionType: 'long_text',
    submission: {
      responsePlaceholder: 'Escribe aqui tu respuesta, hallazgos o lo que realizaste en la actividad.',
      evidencePlaceholder: 'Opcional: pega evidencia, enlaces o notas complementarias.',
    },
    validation: defaultActivityValidationConfig,
  }
}
