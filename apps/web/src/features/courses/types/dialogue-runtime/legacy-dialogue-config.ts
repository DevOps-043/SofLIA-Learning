import {
  dialogueActivityConfigSchema,
  type DialogueActivityConfig,
} from './dialogue-activity-config.schema'

type LegacyDialogueScene = {
  character: string
  message: string
}

type LegacyDialogueConfigInput = {
  activityContent: unknown
  activityDescription?: unknown
  activityTitle?: unknown
  aiPrompts?: unknown
}

const LEARNER_CHARACTERS = new Set([
  'alumno',
  'estudiante',
  'learner',
  'participante',
  'student',
  'user',
  'usuario',
])

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readPromptList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(readText).filter(Boolean)
  }

  const rawValue = readText(value)
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map(readText).filter(Boolean)
    }
  } catch {
    // Plain prompt content is supported below.
  }

  return rawValue
    .split(/\r?\n/u)
    .map((prompt) => prompt.trim())
    .filter(Boolean)
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized

  const candidate = normalized.slice(0, maxLength + 1)
  const lastSpace = candidate.lastIndexOf(' ')
  return candidate.slice(0, lastSpace >= maxLength * 0.8 ? lastSpace : maxLength).trim()
}

function normalizeCharacter(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function readScenes(content: Record<string, unknown>): LegacyDialogueScene[] {
  if (!Array.isArray(content.scenes)) return []

  return content.scenes.flatMap((scene) => {
    const record = readRecord(scene)
    const character = readText(record?.character)
    const message = readText(record?.message)

    return character && message ? [{ character, message }] : []
  })
}

function isLearnerScene(scene: LegacyDialogueScene) {
  return LEARNER_CHARACTERS.has(normalizeCharacter(scene.character))
}

function extractQuestion(message: string) {
  const questions = message.match(/¿[^?]+\?/gu)
  const question = questions?.at(-1)
  return question ? truncateText(question, 600) : null
}

/**
 * Adapts CourseEngine's historical `{ scenes, introduction, conclusion }`
 * activities to the inline SofLIA dialogue runtime. The old side-panel flow is
 * no longer available while the learner is on the activities tab, so leaving
 * these records config-less makes their primary action open an unusable panel.
 */
export function buildLegacyDialogueActivityConfig({
  activityContent,
  activityDescription,
  activityTitle,
  aiPrompts,
}: LegacyDialogueConfigInput): DialogueActivityConfig | null {
  const content = readRecord(activityContent)
  const plainContent = content ? '' : readText(activityContent)
  const scenes = content ? readScenes(content) : []
  const sofliaScenes = scenes.filter((scene) => !isLearnerScene(scene))
  const introduction = readText(content?.introduction)
  const conclusion = readText(content?.conclusion)
  const prompts = readPromptList(aiPrompts)
  if (
    sofliaScenes.length === 0 &&
    !introduction &&
    !conclusion &&
    !plainContent &&
    prompts.length === 0
  ) {
    return null
  }

  const title = truncateText(readText(activityTitle) || 'Actividad con SofLIA', 240)
  const activityDescriptionText = readText(activityDescription)
  const learningSummary =
    conclusion ||
    sofliaScenes.at(-1)?.message ||
    introduction ||
    plainContent ||
    prompts[0] ||
    title
  const visibleGoal = truncateText(
    activityDescriptionText ||
      introduction ||
      plainContent ||
      `Reflexiona sobre ${title}.`,
    1000,
  )
  const scenario = truncateText(introduction || plainContent || visibleGoal, 2000)
  const openingMessage = sofliaScenes[0]?.message
    ? truncateText(sofliaScenes[0].message, 1200)
    : truncateText(
        `${activityDescriptionText || introduction || plainContent || conclusion || title} ¿Cómo aplicarías este aprendizaje en una situación real de tu trabajo?`,
        1200,
      )
  const criterionDescription = truncateText(learningSummary, 1000)
  const expectedEvidence = truncateText(learningSummary, 600)
  const challengePrompts = [
    ...sofliaScenes.slice(1).map((scene) => scene.message),
    ...prompts,
  ]
    .map((message) => extractQuestion(message))
    .filter((question): question is string => Boolean(question))
    .slice(0, 6)
  const hintMessages = sofliaScenes
    .slice(1)
    .map((scene) => truncateText(scene.message, 1200))
    .filter((message) => !extractQuestion(message))
    .slice(0, 2)

  const parsed = dialogueActivityConfigSchema.safeParse({
    interactionType: 'soflia_dialogue',
    runtimeType: 'SOFLIA_DIALOGUE',
    schemaVersion: 'legacy-scenes-1.0.0',
    title,
    visibleGoal,
    learningObjective: visibleGoal,
    scenario,
    openingMessage,
    successCriteria: [
      {
        id: 'legacy_learning_goal',
        label: truncateText(`Explica el aprendizaje central de ${title}`, 240),
        description: criterionDescription,
        required: true,
      },
    ],
    expectedEvidence: expectedEvidence ? [expectedEvidence] : [],
    commonMistakes: [],
    hintLadder: hintMessages.map((message, index) => ({
      id: `legacy_hint_${index + 1}`,
      level: index + 1,
      content: message,
      targetCriterionId: 'legacy_learning_goal',
    })),
    challengePrompts,
    contextAdaptation: {
      enabled: true,
      focus: ['role'],
    },
    rescueContent: truncateText(learningSummary, 2500),
    rubric: [
      {
        id: 'legacy_comprehension',
        label: 'Comprensión y aplicación del aprendizaje central',
        description: criterionDescription,
        weight: 100,
      },
    ],
  })

  return parsed.success ? parsed.data : null
}
