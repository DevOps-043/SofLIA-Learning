import type { TFunction } from 'i18next';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';
import { BusinessAssignCourseUserCard } from './BusinessAssignCourseUserCard';
import modalStyles from '../ContentModal.module.css';

interface BusinessAssignCourseUsersGridProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseUsersGrid({ modal, t, theme }: BusinessAssignCourseUsersGridProps) {
  return (
    <div className={modalStyles.userGrid}>
      {modal.loadingUsers ? (
        <div className={modalStyles.emptyNotice}>
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `color-mix(in srgb, ${theme.onPrimaryColor} 10.2%, transparent)`, borderTopColor: theme.primaryColor }} />
          <span>{t('assignCourse.loading.users', 'Cargando usuarios...')}</span>
        </div>
      ) : modal.availableUsers.length === 0 ? (
        <div className={modalStyles.emptyNotice}>
          <span>{t('assignCourse.empty.noUsers', 'No se encontraron usuarios')}</span>
        </div>
      ) : (
        modal.availableUsers.map((user, index) => (
          <BusinessAssignCourseUserCard key={user.id} user={user} index={index} modal={modal} theme={theme} />
        ))
      )}
    </div>
  );
}
