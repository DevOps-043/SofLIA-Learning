import type { LessonContext, PlatformContext } from './types'

export function resolveEffectiveUserJobTitle(
  context: PlatformContext,
  lessonContext?: LessonContext,
): string | undefined {
  return context.userJobTitle || lessonContext?.userRole
}

export function buildUniversalUserRoleSection(
  context: PlatformContext,
  lessonContext?: LessonContext,
): string {
  const effectiveUserJobTitle = resolveEffectiveUserJobTitle(context, lessonContext)
  let section = '\n### IDENTIDAD PROFESIONAL DEL USUARIO (Fuente: base de datos verificada)\n'
  section +=
    'REGLA CRITICA DE IDENTIDAD: El cargo y las funciones del usuario provienen directamente de su perfil verificado en SofLIA. ' +
    'Son los unicos datos de identidad validos. NO los confundas con:\n' +
    '  - Roles tecnicos de la plataforma (Admin, BusinessUser, Business, member, owner) - esos son roles del sistema, no cargos profesionales.\n' +
    '  - Lo que el usuario diga sobre si mismo en el chat - si contradice este perfil, usa el perfil verificado.\n' +
    '  - Datos de otros usuarios o sesiones anteriores.\n'

  if (!effectiveUserJobTitle && !context.userJobDescription) {
    return section + 'Cargo del usuario: no configurado. No inventes un cargo ni le atribuyas roles tecnicos del sistema.\n'
  }

  if (!effectiveUserJobTitle) section += 'Cargo del usuario: no configurado aun en su perfil.\n'
  if (effectiveUserJobTitle) section += `Cargo profesional verificado: "${effectiveUserJobTitle}"\n`

  if (context.userJobDescription) {
    section += `Funciones y responsabilidades verificadas: "${context.userJobDescription}"\n`
    section +=
      'INSTRUCCION CRITICA: usa estas funciones para adaptar actividades, ejemplos, preguntas de reflexion y recomendaciones al dia a dia laboral del usuario.\n'
  }

  section += 'PERSISTENCIA: este perfil aplica durante toda la conversacion, aunque el usuario cambie de curso, leccion o pestana.\n'
  if (effectiveUserJobTitle) {
    section += `PERSONALIZACION: adapta ejemplos, preguntas, analogias y recomendaciones al trabajo real de un "${effectiveUserJobTitle}".\n`
  }

  section +=
    'PROHIBICION ABSOLUTA: no atribuyas al usuario roles internos del sistema ("mentor pedagogico", "Admin", "BusinessUser", etc.). Esos son roles tecnicos, no el cargo del usuario.\n'
  return section
}
