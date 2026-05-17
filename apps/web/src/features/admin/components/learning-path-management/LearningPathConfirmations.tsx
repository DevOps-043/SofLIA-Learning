import { ConfirmationModal } from '../ConfirmationModal'
import type { LearningPathOrganizationAssignmentSummary, LpTranslator, SetOrganizationAssignmentToRevoke, SetRemoveTarget } from './types'

interface LearningPathConfirmationsProps {
  lp: LpTranslator
  organizationAssignmentToRevoke: LearningPathOrganizationAssignmentSummary | null
  removeTargetId: string | null
  saving: boolean
  setOrganizationAssignmentToRevoke: SetOrganizationAssignmentToRevoke
  setRemoveTargetId: SetRemoveTarget
  onConfirmRemoveItem: () => Promise<void>
  onConfirmRevokeOrganizationAssignment: () => Promise<void>
}

export function LearningPathConfirmations({
  lp,
  organizationAssignmentToRevoke,
  removeTargetId,
  saving,
  setOrganizationAssignmentToRevoke,
  setRemoveTargetId,
  onConfirmRemoveItem,
  onConfirmRevokeOrganizationAssignment,
}: LearningPathConfirmationsProps) {
  return (
    <>
      <ConfirmationModal
        isOpen={Boolean(removeTargetId)}
        onClose={() => setRemoveTargetId(null)}
        onConfirm={() => void onConfirmRemoveItem()}
        title={lp('removeTitle', 'Quitar taller de la ruta')}
        message={lp('removeMessage', 'El taller se quitara de la secuencia, pero no se revocara el acceso que ya haya sido otorgado por otras asignaciones.')}
        confirmText={lp('removeConfirm', 'Quitar taller')}
        type="danger"
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={Boolean(organizationAssignmentToRevoke)}
        onClose={() => setOrganizationAssignmentToRevoke(null)}
        onConfirm={() => void onConfirmRevokeOrganizationAssignment()}
        title={lp('revokeOrganizationTitle', 'Revocar asignacion organizacional')}
        message={lp('revokeOrganizationMessage', 'La empresa "{{organization}}" dejara de tener esta ruta activa para nuevas consultas. Los accesos directos ya otorgados por otras vias no se eliminan automaticamente.', {
          organization: organizationAssignmentToRevoke?.organization_name || '',
        })}
        confirmText={lp('revokeOrganizationAssignment', 'Revocar asignacion')}
        type="danger"
        isLoading={saving}
      />
    </>
  )
}
