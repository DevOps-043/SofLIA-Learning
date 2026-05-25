import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import type { TimeEstimationResult } from '@/features/admin/services/courseTimeEstimation.types'
import type { EstimationUpdateSummary } from './estimation-results.types'
import type {
  EstimateSupabaseClient,
  LessonActivityInfo,
  LessonMaterialInfo,
  PendingTimeItems,
} from './estimation.types'

async function updateMaterial(
  supabase: EstimateSupabaseClient,
  material: LessonMaterialInfo,
  result: TimeEstimationResult | undefined,
) {
  if (!result) return false

  const { error } = await supabase
    .from('lesson_materials')
    .update({ estimated_time_minutes: result.estimatedMinutes })
    .eq('material_id', material.material_id)

  if (error) throw error
  return true
}

async function updateActivity(
  supabase: EstimateSupabaseClient,
  activity: LessonActivityInfo,
  result: TimeEstimationResult | undefined,
) {
  if (!result) return false

  const { error } = await supabase
    .from('lesson_activities')
    .update({ estimated_time_minutes: result.estimatedMinutes })
    .eq('activity_id', activity.activity_id)

  if (error) throw error
  return true
}

export async function applyEstimationResults(
  supabase: EstimateSupabaseClient,
  pendingItems: PendingTimeItems,
  estimationResults: TimeEstimationResult[],
): Promise<EstimationUpdateSummary> {
  const resultById = new Map(estimationResults.map((result) => [result.targetId, result]))
  const affectedLessonIds = new Set<string>()
  let updatedMaterials = 0
  let updatedActivities = 0

  await Promise.all([
    ...pendingItems.materials.map(async (material) => {
      if (await updateMaterial(supabase, material, resultById.get(material.material_id))) {
        updatedMaterials += 1
        affectedLessonIds.add(material.lesson_id)
      }
    }),
    ...pendingItems.activities.map(async (activity) => {
      if (await updateActivity(supabase, activity, resultById.get(activity.activity_id))) {
        updatedActivities += 1
        affectedLessonIds.add(activity.lesson_id)
      }
    }),
  ])

  const recalculation = await AdminLessonsService.recalculateLessonDurations(
    Array.from(affectedLessonIds),
  )

  return {
    updatedMaterials,
    updatedActivities,
    recalculatedLessons: recalculation.updated,
    recalculationErrors: recalculation.errors,
  }
}
