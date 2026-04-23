import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type { LearnMaterialSummary } from '../../components/learn/types'

export function buildMaterialsContext(
  currentMaterials?: LearnMaterialSummary[],
): CourseLessonContext['materialsContext'] {
  if (!currentMaterials) {
    return undefined
  }

  const requiredMaterials = currentMaterials.filter(
    (material) => material.is_required,
  )

  return {
    totalMaterials: currentMaterials.length,
    requiredMaterials: requiredMaterials.length,
    materialTypes: currentMaterials.map((material) => ({
      title: material.material_title,
      type: material.material_type,
      description: material.material_description,
      isRequired: !!material.is_required,
    })),
  }
}
