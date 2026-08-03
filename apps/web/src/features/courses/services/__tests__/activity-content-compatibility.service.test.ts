import { describe, expect, it } from 'vitest'
import {
  isInteractiveLessonActivity,
  resolveActivityConfig,
  resolveActivityConfigFromRecord,
} from '../activity-content-compatibility.service'

describe('activity-content-compatibility.service', () => {
  it('builds inline answer fields from legacy blanks', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent:
        'Para redactar un correo, uso _____.\nPara validar noticias, uso _____.',
    })

    expect(config?.interactionType).toBe('inline_answers')
    if (!config || config.interactionType !== 'inline_answers') {
      throw new Error('Expected inline answers config')
    }

    expect(config.submission.fields).toHaveLength(2)
    expect(config.submission.fields[0]?.id).toBe('blank_1')
  })

  it('builds checklist config from legacy exercise checklist content', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent: '[ ] Analiza el prompt\n[x] Documenta tu respuesta',
    })

    expect(config?.interactionType).toBe('checklist')
    if (!config || config.interactionType !== 'checklist') {
      throw new Error('Expected checklist config')
    }

    expect(config.submission.checklistItems.map((item) => item.label)).toEqual([
      'Analiza el prompt',
      'Documenta tu respuesta',
    ])
  })

  it('keeps reflection activities read-only when they have no explicit config', () => {
    const config = resolveActivityConfig({
      activityType: 'reflection',
      activityContent: '[ ] Analiza el prompt\n[x] Documenta tu respuesta',
    })

    expect(config).toBeNull()
    expect(isInteractiveLessonActivity('reflection')).toBe(false)
  })

  it('keeps explicitly configured reflection activities read-only', () => {
    const config = resolveActivityConfig({
      activityType: 'reflection',
      activityContent: 'Escribe una conclusion breve.',
      rawActivityConfig: {
        interactionType: 'long_text',
        submission: {
          responsePlaceholder: 'Escribe tu conclusion.',
        },
        validation: {
          enabled: false,
          requiredForCompletion: false,
          rubric: [],
        },
      },
    })

    expect(config).toBeNull()
  })

  it('merges tool detection and SofLIA validation into fallback config', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent: 'Copia este prompt en ChatGPT y pega aqui la evidencia.',
      aiPrompts: 'Analiza este caso paso a paso',
      requiresSofliaValidation: true,
    })

    expect(config?.toolTask?.toolKey).toBe('chatgpt')
    expect(config?.validation.enabled).toBe(true)
  })

  it('returns null for quiz and ai_chat because they preserve current flow', () => {
    expect(
      resolveActivityConfig({
        activityType: 'quiz',
        activityContent: '{"questions":[]}',
      }),
    ).toBeNull()
    expect(isInteractiveLessonActivity('quiz')).toBe(false)
    expect(isInteractiveLessonActivity('ai_chat')).toBe(false)
  })

  it('keeps explicit SofLIA dialogue config even on legacy ai_chat activities', () => {
    const config = resolveActivityConfig({
      activityType: 'ai_chat',
      activityContent: '{"scenes":[]}',
      rawActivityConfig: {
        interactionType: 'soflia_dialogue',
        runtimeType: 'SOFLIA_DIALOGUE',
        visibleGoal: 'Practicar comunicacion asertiva.',
        scenario: 'Explica una situacion laboral con tension comunicativa.',
        openingMessage: 'Describe brevemente la situacion.',
        successCriteria: [
          {
            id: 'impacto',
            label: 'Explica impacto',
            required: true,
          },
        ],
        rescueContent: 'Una respuesta fuerte conecta conducta, impacto y alternativa.',
        rubric: [
          {
            id: 'claridad',
            label: 'Claridad',
            weight: 100,
          },
        ],
      },
    })

    expect(config?.interactionType).toBe('soflia_dialogue')
  })

  it('promotes legacy scene scripts to the central SofLIA dialogue runtime', () => {
    const config = resolveActivityConfigFromRecord({
      activity_title:
        "Desmitificando el 'Oráculo' de la IA: Predicción vs. Conocimiento",
      activity_type: 'ai_chat',
      activity_content: JSON.stringify({
        introduction:
          'Comprende por qué un LLM predice patrones en vez de conocer hechos.',
        scenes: [
          {
            character: 'Lia',
            message:
              'La IA puede sonar como un oráculo. ¿Crees que esa expectativa es realista?',
          },
          {
            character: 'Usuario',
            message: 'Prompt: Explica por qué un LLM no conoce la realidad.',
          },
          {
            character: 'Lia',
            message:
              'Un LLM predice la siguiente palabra a partir de patrones. ¿Qué verificarías antes de tomar una decisión?',
          },
        ],
        conclusion:
          'Los LLM generan respuestas probables y sus afirmaciones importantes deben verificarse.',
      }),
    })

    expect(config?.interactionType).toBe('soflia_dialogue')
    if (!config || config.interactionType !== 'soflia_dialogue') {
      throw new Error('Expected SofLIA dialogue config')
    }

    expect(config.schemaVersion).toBe('legacy-scenes-1.0.0')
    expect(config.openingMessage).toContain('¿Crees que esa expectativa')
    expect(config.challengePrompts).toEqual([
      '¿Qué verificarías antes de tomar una decisión?',
    ])
    expect(config.successCriteria[0]?.id).toBe('legacy_learning_goal')
  })

  it('keeps config-less dialogue introductions in the central runtime', () => {
    const config = resolveActivityConfigFromRecord({
      activity_title: 'Estrategias para Persuadir al CFO',
      activity_type: 'ai_chat',
      activity_content: {
        introduction:
          'Transforma beneficios técnicos en métricas de ROI y mitigación de riesgos.',
      },
    })

    expect(config?.interactionType).toBe('soflia_dialogue')
    if (!config || config.interactionType !== 'soflia_dialogue') {
      throw new Error('Expected SofLIA dialogue config')
    }

    expect(config.openingMessage).toContain('¿Cómo aplicarías este aprendizaje')
  })

  it('routes new plain-content ai_chat records to the central runtime', () => {
    const config = resolveActivityConfigFromRecord({
      activity_title: 'Conversación aplicada',
      activity_description: 'Practica una decisión laboral.',
      activity_type: 'ai_chat',
      activity_content: 'Explica la decisión, su razón principal y el impacto esperado.',
      ai_prompts: '¿Qué riesgo validarías primero?',
    })

    expect(config?.interactionType).toBe('soflia_dialogue')
  })

  it('promotes SofLIA dialogue config from activity_content for generated ai_chat records', () => {
    const config = resolveActivityConfig({
      activityType: 'ai_chat',
      activityContent: JSON.stringify({
        interactionType: 'soflia_dialogue',
        runtimeType: 'SOFLIA_DIALOGUE',
        visibleGoal: 'Analizar seguridad psicologica en equipos remotos.',
        scenario: 'Un equipo remoto evita compartir ideas en reuniones.',
        openingMessage: 'Que desafios has notado?',
        successCriteria: [
          {
            id: 'identifies_challenges',
            label: 'Identifica desafios',
            required: true,
          },
        ],
        rescueContent:
          'La seguridad psicologica permite participar sin miedo a castigo.',
        rubric: [
          {
            id: 'challenges_identified',
            label: 'Identificacion de desafios',
            weight: 100,
          },
        ],
      }),
      rawActivityConfig: null,
    })

    expect(config?.interactionType).toBe('soflia_dialogue')
    expect(config?.runtimeType).toBe('SOFLIA_DIALOGUE')
  })

  it('does not infer external tool actions from plain mentions in the question text', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent:
        'Completa cada frase escribiendo la herramienta correcta ChatGPT, Atlas u otra.',
    })

    expect(config?.toolTask).toBeUndefined()
  })

  it('maps snake_case activity records from Supabase correctly', () => {
    const config = resolveActivityConfigFromRecord({
      activity_type: 'exercise',
      activity_content: 'Para redactar un correo, uso _____.',
      ai_prompts: 'Usa ChatGPT',
      requires_soflia_validation: true,
      external_tool_key: 'chatgpt',
    })

    expect(config?.interactionType).toBe('inline_answers')
    expect(config?.validation.enabled).toBe(true)
    expect(config?.toolTask?.toolKey).toBe('chatgpt')
  })
})
