import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'
import modalStyles from '../ContentModal.module.css'

export function ModalFooter({ activeUserCount, assignmentMode, handleAssign, isAssigning, onClose, selectedNodeIds, selectedUserIds, t, theme }: {
  activeUserCount: number
  assignmentMode: AssignmentMode
  handleAssign: () => Promise<void>
  isAssigning: boolean
  onClose: () => void
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  const isDisabled = isAssigning || (assignmentMode === 'users' && selectedUserIds.size === 0) || (assignmentMode === 'node' && selectedNodeIds.size === 0)
  const count = assignmentMode === 'users' ? selectedUserIds.size : assignmentMode === 'all' ? activeUserCount : selectedNodeIds.size

  return (
    <footer className={modalStyles.footer}>
      <p className={modalStyles.footerNote}>{t('assignLearningPath.footerNote', { defaultValue: 'Las asignaciones solo se aplican a integrantes activos de esta empresa.' })}</p>
      <div className={modalStyles.footerActions}>
        <button type="button" onClick={onClose} className={modalStyles.secondaryButton}>{t('assignLearningPath.cancel', { defaultValue: 'Cancelar' })}</button>
        <button type="button" onClick={() => void handleAssign()} disabled={isDisabled} className={modalStyles.primaryButton}>
          {isAssigning ? t('assignLearningPath.assigning', { defaultValue: 'Asignando...' }) : t('assignLearningPath.confirm', { defaultValue: 'Asignar ruta ({{count}})', count })}
        </button>
      </div>
    </footer>
  )
}
