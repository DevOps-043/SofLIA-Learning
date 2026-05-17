import type { Translate } from './types'
import type { LearningPathStateController } from './useLearningPathState'

export function useLearningPathRevokeActions({
  loadData,
  state,
  t,
}: {
  loadData: () => Promise<void>
  state: LearningPathStateController
  t: Translate
}) {
  async function handleConfirmRevokeOrganizationAssignment() {
    const target = state.organizationAssignmentToRevoke
    if (!target) return
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/companies/${target.organization_id}/learning-paths?assignmentId=${target.id}`, { method: 'DELETE' })
      await assertSuccess(response, t('learningPathsPage.revokeOrganizationError', 'No se pudo revocar la asignacion organizacional'))
      state.setOrganizationAssignmentToRevoke(null)
      await loadData()
    }, t('learningPathsPage.revokeOrganizationError', 'No se pudo revocar la asignacion organizacional'))
  }

  async function handleConfirmRevokeUserAssignment() {
    const target = state.userAssignmentToRevoke
    if (!target) return
    await runSaving(state, async () => {
      const response = await fetch(`/api/admin/companies/${target.organization_id}/user-learning-path-assignments?assignmentId=${target.id}`, { method: 'DELETE' })
      await assertSuccess(response, t('learningPathsPage.revokeUserError', 'No se pudo revocar la asignacion individual'))
      state.setUserAssignmentToRevoke(null)
      await loadData()
    }, t('learningPathsPage.revokeUserError', 'No se pudo revocar la asignacion individual'))
  }

  return { handleConfirmRevokeOrganizationAssignment, handleConfirmRevokeUserAssignment }
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
