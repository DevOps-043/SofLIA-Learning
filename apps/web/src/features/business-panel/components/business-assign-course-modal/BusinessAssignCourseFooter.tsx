import { motion } from 'framer-motion';
import { ChevronRight, UserCheck } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseFooterProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseFooter({ modal, t, theme }: BusinessAssignCourseFooterProps) {
  const isDisabled = modal.isAssigning || resolveIsDisabled(modal)

  return (
    <div className="shrink-0 p-5 px-8 flex items-center justify-between gap-4 border-t" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
      <div className="hidden sm:flex items-center gap-2 opacity-30 select-none">
        <UserCheck className="w-5 h-5" style={{ color: theme.textColor }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>Asignar Contenido</span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={modal.handleClose}
          className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
          style={{ color: theme.mutedTextColor, backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
        >
          {t('users.buttons.cancel')}
        </button>
        <motion.button
          onClick={modal.handleAssign}
          disabled={isDisabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-[2] sm:flex-none px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale"
          style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
        >
          {modal.isAssigning ? (
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
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
        </motion.button>
      </div>
    </div>
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
