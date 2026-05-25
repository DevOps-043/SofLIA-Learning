import type { TFunction } from 'i18next';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';
import { BusinessAssignCourseUserCard } from './BusinessAssignCourseUserCard';

interface BusinessAssignCourseUsersGridProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseUsersGrid({ modal, t, theme }: BusinessAssignCourseUsersGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {modal.loadingUsers ? (
        <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30 gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `color-mix(in srgb, ${theme.onPrimaryColor} 10.2%, transparent)`, borderTopColor: theme.primaryColor }} />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('assignCourse.loading.users', 'Cargando usuarios...')}</span>
        </div>
      ) : modal.availableUsers.length === 0 ? (
        <div className="col-span-full py-12 text-center opacity-30">
          <span className="text-[10px] font-black uppercase tracking-widest">{t('assignCourse.empty.noUsers', 'No se encontraron usuarios')}</span>
        </div>
      ) : (
        modal.availableUsers.map((user, index) => (
          <BusinessAssignCourseUserCard key={user.id} user={user} index={index} modal={modal} theme={theme} />
        ))
      )}
    </div>
  );
}
