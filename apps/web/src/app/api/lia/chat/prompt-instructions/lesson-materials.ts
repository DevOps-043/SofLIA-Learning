import type { LessonContext } from './types'

export function buildLessonMaterialsSection(lessonContext: LessonContext): string {
  if (!lessonContext.materials) return ''

  let section = '\nMATERIALES DISPONIBLES EN ESTA LECCION:\n'
  section += `- Total: ${lessonContext.materials.totalMaterials} | Requeridos: ${lessonContext.materials.requiredMaterials}\n`

  lessonContext.materials.items?.slice(0, 8).forEach((material, index) => {
    section += `${index + 1}. ${material.title} [${material.type}]${material.isRequired ? ' requerido' : ' opcional'}\n`
    if (material.description) section += `   Descripcion: ${material.description}\n`
  })

  return section
}
