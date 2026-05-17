import type { LearningPathUpsertPayload } from '../../types'
import type { Translate } from './types'
import type { LearningPathStateController } from './useLearningPathState'

export function useLearningPathMetadataActions({
  learningPathId,
  state,
  t,
}: {
  learningPathId: string
  state: LearningPathStateController
  t: Translate
}) {
  async function handleMetadataSave(updates: Partial<LearningPathUpsertPayload>) {
    state.setSaving(true)
    state.setError(null)

    try {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || t('learningPathsPage.updateError', 'No se pudo actualizar la ruta de aprendizaje'))
      }
      state.setLearningPath(data.learningPath)
    } catch (saveError) {
      state.setError(
        saveError instanceof Error
          ? saveError.message
          : t('learningPathsPage.updateError', 'No se pudo actualizar la ruta de aprendizaje'),
      )
    } finally {
      state.setSaving(false)
    }
  }

  return { handleMetadataSave }
}
