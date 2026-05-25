import type { TFunction } from 'i18next';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';
import { BusinessAssignCourseSearch } from './BusinessAssignCourseSearch';
import { BusinessAssignCourseUsersGrid } from './BusinessAssignCourseUsersGrid';

interface BusinessAssignCourseUserSelectionProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseUserSelection({ modal, t, theme }: BusinessAssignCourseUserSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>
          Seleccionar Destinatarios ({modal.selectedUserCount} seleccionados)
        </label>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
            {modal.availableUserCount} disponibles
          </div>
        </div>
      </div>
      <BusinessAssignCourseSearch modal={modal} t={t} theme={theme} />
      <BusinessAssignCourseUsersGrid modal={modal} t={t} theme={theme} />
    </div>
  );
}
