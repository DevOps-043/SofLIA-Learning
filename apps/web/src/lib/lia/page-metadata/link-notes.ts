export function buildPromptCreationNote(): string {
  let note = '\n\n💡 NOTA SOBRE CREACIÓN DE PROMPTS:\n';
  note += 'Si el usuario quiere crear prompts, ofrécele ayuda directamente desde este chat usando el Modo Prompts.\n';
  note += 'Puedes activarlo automáticamente cuando detectes que el usuario quiere crear un prompt.\n';
  return note;
}

export function buildCoursesNavigationNote(): string {
  let note = '\n\n⚠️ NOTA IMPORTANTE SOBRE VER CURSOS:\n';
  note += 'Cuando el usuario pregunte sobre "ver todos los cursos", "cursos disponibles", o "catálogo de cursos":\n';
  note += '- Para ver TODOS los cursos disponibles: Usa [Dashboard](/dashboard)\n';
  note += '- Para usuarios Business: Los cursos asignados están en [Dashboard de Empleado](/{orgSlug}/business-user/dashboard) - IMPORTANTE: Reemplaza {orgSlug} con el slug real de la organización del usuario\n';
  note += '- Para ver el detalle de un curso específico: Usa /courses/[slug] donde [slug] es el identificador del curso\n';
  note += 'IMPORTANTE: Las rutas /business-panel/* y /business-user/* SIEMPRE deben tener el prefijo /{orgSlug}/ donde orgSlug es el slug de la organización del usuario.\n';
  return note;
}
