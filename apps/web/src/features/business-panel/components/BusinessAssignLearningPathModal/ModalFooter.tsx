import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'

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
    <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8" style={{ borderColor: theme.borderColor }}>
      <p className="text-sm" style={{ color: theme.subtextColor }}>{t('assignLearningPath.footerNote', { defaultValue: 'Las asignaciones se aplicaran solo a usuarios activos de esta empresa.' })}</p>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-3 text-sm font-semibold transition" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>{t('assignLearningPath.cancel', { defaultValue: 'Cancelar' })}</button>
        <button type="button" onClick={() => void handleAssign()} disabled={isDisabled} className="rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>
          {isAssigning ? t('assignLearningPath.assigning', { defaultValue: 'Asignando...' }) : t('assignLearningPath.confirm', { defaultValue: 'Asignar ruta ({{count}})', count })}
        </button>
      </div>
    </div>
  )
}
