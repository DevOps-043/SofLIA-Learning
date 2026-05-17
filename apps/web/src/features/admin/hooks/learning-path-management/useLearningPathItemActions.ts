import { moveItem } from './moveItem'
import type { Translate } from './types'
import type { LearningPathStateController } from './useLearningPathState'

export function useLearningPathItemActions({
  learningPathId,
  loadData,
  state,
  t,
}: {
  learningPathId: string
  loadData: () => Promise<void>
  state: LearningPathStateController
  t: Translate
}) {
  async function handleAddCourse() {
    if (!state.selectedCourseId) return
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: state.selectedCourseId }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || t('learningPathsPage.addError', 'No se pudo agregar el curso'))
      state.setSelectedCourseId('')
      await loadData()
    }, t('learningPathsPage.addError', 'No se pudo agregar el curso'))
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (!state.learningPath || toIndex < 0 || toIndex >= state.learningPath.items.length) return
    const reordered = moveItem(state.learningPath.items, fromIndex, toIndex)
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/items/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedItemIds: reordered.map((item) => item.id) }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || t('learningPathsPage.reorderError', 'No se pudo reordenar la ruta'))
      state.setLearningPath(data.learningPath)
    }, t('learningPathsPage.reorderError', 'No se pudo reordenar la ruta'))
  }

  async function handleConfirmedRemoveItem() {
    if (!state.removeTargetId) return
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/items/${state.removeTargetId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || t('learningPathsPage.removeError', 'No se pudo eliminar el taller'))
      state.setRemoveTargetId(null)
      await loadData()
    }, t('learningPathsPage.removeError', 'No se pudo eliminar el taller'))
  }

  return { handleAddCourse, handleConfirmedRemoveItem, handleReorder }
}

async function runSaving(state: LearningPathStateController, task: () => Promise<void>, fallback: string) {
  state.setSaving(true)
  state.setError(null)
  try {
    await task()
  } catch (error) {
    state.setError(error instanceof Error ? error.message : fallback)
  } finally {
    state.setSaving(false)
  }
}
