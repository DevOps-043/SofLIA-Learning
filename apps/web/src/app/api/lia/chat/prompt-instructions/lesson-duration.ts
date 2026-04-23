import type { LessonContext } from './types'

export function buildVerifiedLessonDurationSection(
  lessonContext: LessonContext,
): string {
  const totalDurationMinutes =
    typeof lessonContext.totalDurationMinutes === 'number' &&
    lessonContext.totalDurationMinutes > 0
      ? lessonContext.totalDurationMinutes
      : undefined
  const videoDurationMinutes =
    typeof lessonContext.durationSeconds === 'number' &&
    lessonContext.durationSeconds > 0
      ? Math.ceil(lessonContext.durationSeconds / 60)
      : undefined

  if (!totalDurationMinutes && !videoDurationMinutes) return ''

  let section = '\nDURACION VERIFICADA DE LA LECCION:\n'
  if (totalDurationMinutes) {
    section += `- Duracion total verificada de la leccion: ${totalDurationMinutes} minutos\n`
  }
  if (videoDurationMinutes) {
    section += `- Duracion verificada del video: ${videoDurationMinutes} minutos\n`
  }
  return section
}
