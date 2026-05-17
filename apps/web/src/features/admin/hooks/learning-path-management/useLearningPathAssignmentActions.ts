import type { Translate } from './types'
import type { LearningPathStateController } from './useLearningPathState'

export function useLearningPathAssignmentActions({
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
  async function handleAssignToOrganization() {
    if (!state.selectedOrganizationId) return
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/companies/${state.selectedOrganizationId}/learning-paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningPathId }),
      })
      await assertSuccess(response, t('learningPathsPage.assignOrganizationError', 'No se pudo asignar la ruta a la empresa'))
      state.setSelectedOrganizationId('')
      await loadData()
    }, t('learningPathsPage.assignOrganizationError', 'No se pudo asignar la ruta a la empresa'))
  }

  async function handleAssignToUser() {
    if (!state.selectedUserOrganizationId || !state.selectedUserId) return
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/companies/${state.selectedUserOrganizationId}/user-learning-path-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.selectedUserId, learningPathId }),
      })
      await assertSuccess(response, t('learningPathsPage.assignUserError', 'No se pudo asignar la ruta al usuario'))
      state.setSelectedUserOrganizationId('')
      state.setSelectedUserId('')
      await loadData()
    }, t('learningPathsPage.assignUserError', 'No se pudo asignar la ruta al usuario'))
  }

  return { handleAssignToOrganization, handleAssignToUser }
}

async function assertSuccess(response: Response, fallback: string) {
  const data = await response.json()
  if (!response.ok || !data.success) throw new Error(data.error || fallback)
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
