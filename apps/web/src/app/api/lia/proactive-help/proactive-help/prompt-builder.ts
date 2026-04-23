import type { SessionContext } from '@/lib/rrweb/session-analyzer'
import type { DifficultyAnalysis } from '@/lib/rrweb/difficulty-pattern-detector'

export function buildProactivePrompt(
  analysis: DifficultyAnalysis,
  sessionContext: SessionContext | null,
  workshopId?: string,
  activityId?: string,
) {
  const patternDescriptions = analysis.patterns
    .map((pattern) => `- ${pattern.description} (severidad: ${pattern.severity})`)
    .join('\n')

  return `
# Contexto de la situación

He detectado que el usuario está experimentando dificultades en el taller. Aquí están los detalles:

## Patrones de dificultad detectados:
${patternDescriptions}

## Score de dificultad: ${(analysis.overallScore * 100).toFixed(0)}%

${sessionContext ? buildSessionSection(sessionContext) : ''}

${workshopId ? `Workshop ID: ${workshopId}` : ''}
${activityId ? `Actividad ID: ${activityId}` : ''}

# Tu tarea

Como LIA, ofrece ayuda proactiva al usuario. Tu respuesta debe:

1. **Ser empática**: Reconoce que aprender puede ser desafiante
2. **Ser específica**: Referencia los patrones detectados de forma natural
3. **Ser accionable**: Ofrece pasos concretos que el usuario pueda seguir ahora mismo
4. **Ser motivadora**: Mantén un tono positivo y alentador

Estructura tu respuesta en:
- Un saludo breve y empático
- Observación de lo que has notado (sin ser muy técnico)
- 2-3 sugerencias concretas para ayudar
- Una pregunta abierta para continuar la conversación

Ejemplo de tono: "Hola! He notado que llevas un rato trabajando en esta actividad. A veces cuando [patrón detectado], puede ayudar [sugerencia]. ¿Te gustaría que revisemos juntos [tema específico]?"
`.trim()
}

function buildSessionSection(sessionContext: SessionContext) {
  return `
## Análisis de sesión:
- Tiempo total: ${Math.round(sessionContext.sessionDuration / 1000)}s
- Clicks totales: ${sessionContext.clickCount}
- Scrolls: ${sessionContext.scrollEvents}
- Inputs escritos: ${sessionContext.inputEvents}
- Intentos detectados: ${sessionContext.attemptsMade}
- Nivel de dificultad: ${sessionContext.difficultyScore.toFixed(2)}
`
}
