import type { PlatformContext } from '../platform-context.service'
import type { LessonContext } from './types'

export function resolveEffectiveUserJobTitle(
  context: PlatformContext,
  lessonContext?: LessonContext,
): string | undefined {
  return lessonContext?.userRole || context.userJobTitle
}

export function buildUniversalUserRoleSection(
  context: PlatformContext,
  lessonContext?: LessonContext,
): string {
  const effectiveUserJobTitle = resolveEffectiveUserJobTitle(context, lessonContext)
  let section = '\n### CONTEXTO UNIVERSAL DEL USUARIO\n'

  if (!effectiveUserJobTitle) {
    return (
      section +
      'Si el cargo del usuario no esta disponible, no inventes uno y no le atribuyas roles internos del sistema.\n'
    )
  }

  section += `Cargo profesional real del usuario: "${effectiveUserJobTitle}"\n`
  section += 'FUENTE DE VERDAD: este cargo proviene del perfil laboral verificado del usuario dentro de SofLIA.\n'
  section += 'INSTRUCCION CRITICA: este cargo es el contexto universal del usuario durante toda la conversacion, aunque cambie de curso, leccion, pestana o actividad.\n'
  section += `INSTRUCCION CRITICA: adapta siempre ejemplos, preguntas, analogias, recomendaciones y siguientes pasos al trabajo real de un "${effectiveUserJobTitle}".\n`
  section += 'PROHIBICION: no atribuyas al usuario roles internos del asistente o del sistema como "mentor pedagogico". Ese es tu rol como asistente, no el cargo del usuario.\n'
  return section
}
