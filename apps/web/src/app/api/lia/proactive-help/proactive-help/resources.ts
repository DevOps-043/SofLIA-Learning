import type { DifficultyAnalysis } from '@/lib/rrweb/difficulty-pattern-detector'
import type { ProactiveResource } from './types'

export function generateResources(
  patterns: DifficultyAnalysis['patterns'],
): ProactiveResource[] {
  const resources = patterns.flatMap((pattern) => {
    switch (pattern.type) {
      case 'failed_attempts':
        return [createPromptGuideResource()]
      case 'excessive_scroll':
        return [createSummaryVideoResource()]
      case 'inactivity':
        return [createPomodoroResource()]
      default:
        return []
    }
  })

  return Array.from(new Map(resources.map((resource) => [resource.title, resource])).values())
}

function createPromptGuideResource() {
  return {
    title: 'Guía: Cómo estructurar un buen prompt',
    description: 'Aprende las mejores prácticas para crear prompts efectivos',
    url: '/recursos/guia-prompts',
  }
}

function createSummaryVideoResource() {
  return {
    title: 'Video: Resumen de conceptos clave',
    description: 'Repaso rápido de los conceptos principales de esta lección',
    url: '/recursos/video-resumen',
  }
}

function createPomodoroResource() {
  return {
    title: 'Tip: Técnica Pomodoro para el aprendizaje',
    description: 'Cómo mantener el enfoque durante el estudio',
    url: '/recursos/pomodoro',
  }
}
