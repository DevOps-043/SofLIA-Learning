import { ChevronRight, UserCheck } from 'lucide-react';
import type { TFunction } from 'i18next';
import modalStyles from '../ContentModal.module.css';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseFooterProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseFooter({ modal, t, theme }: BusinessAssignCourseFooterProps) {
  const isDisabled = modal.isAssigning || resolveIsDisabled(modal)

  return (
    <footer className={modalStyles.footer}>
      <p className={modalStyles.footerNote}>
        <UserCheck aria-hidden="true" className="mr-2 inline h-4 w-4" />
        Las asignaciones solo se aplican a integrantes activos de esta empresa.
      </p>
      <div className={modalStyles.footerActions}>
        <button
          type="button"
          onClick={modal.handleClose}
          className={modalStyles.secondaryButton}
        >
          {t('users.buttons.cancel')}
        </button>
        <button
          type="button"
          onClick={modal.handleAssign}
          disabled={isDisabled}
          className={modalStyles.primaryButton}
        >
          {modal.isAssigning ? (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2"
              style={{
                borderTopColor: theme.onPrimaryColor,
                borderRightColor: `color-mix(in srgb, ${theme.onPrimaryColor} 30.2%, transparent)`,
                borderBottomColor: `color-mix(in srgb, ${theme.onPrimaryColor} 30.2%, transparent)`,
                borderLeftColor: `color-mix(in srgb, ${theme.onPrimaryColor} 30.2%, transparent)`,
              }}
            />
          ) : (
            <>
              <span className="font-black">{getConfirmLabel(modal, t)}</span>
              <ChevronRight className="w-4 h-4" strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </footer>
  );
}

function resolveIsDisabled(modal: BusinessAssignCourseModalState): boolean {
  if (modal.assignmentMode === 'users') {
    return modal.selectedUserCount === 0 && modal.pendingRemovalIds.size === 0
  }
  if (modal.assignmentMode === 'node') {
    return modal.selectedNodeIds.size === 0
  }
  return false // 'all' mode is always enabled
}

function getConfirmLabel(modal: BusinessAssignCourseModalState, t: TFunction<'business'>): string {
  if (modal.assignmentMode === 'all') {
    return `Asignar a Toda la Empresa (${modal.activeUserCount})`
  }
  if (modal.assignmentMode === 'node') {
    return `Asignar a Estructura (${modal.selectedNodeIds.size})`
  }
  if (modal.pendingRemovalIds.size > 0 && modal.selectedUserCount === 0) {
    return `Confirmar (${modal.pendingRemovalIds.size} a quitar)`
  }
  if (modal.pendingRemovalIds.size > 0) {
    return `Confirmar (${modal.selectedUserCount} asignar · ${modal.pendingRemovalIds.size} quitar)`
  }
  return `${t('assignCourse.buttons.confirmAssign', 'Confirmar Asignación')} (${modal.selectedUserCount})`
}
