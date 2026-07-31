import { BookOpen, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import modalStyles from '../ContentModal.module.css';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseHeaderProps {
  courseTitle: string;
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseHeader({ courseTitle, modal, t }: BusinessAssignCourseHeaderProps) {
  return (
    <header className={modalStyles.header}>
      <div className={modalStyles.headerIcon}>
        <BookOpen aria-hidden="true" />
      </div>
      <div className={modalStyles.headerCopy}>
        <p className={modalStyles.eyebrow}>{t('assignCourse.title', 'Asignar curso')}</p>
        <h2 className={modalStyles.title} id="assign-course-title">{courseTitle}</h2>
        <p className={modalStyles.description}>
          Selecciona quién recibirá este contenido y define la fecha objetivo.
        </p>
      </div>
      <button
        aria-label="Cerrar asignación de curso"
        className={modalStyles.closeButton}
        onClick={modal.handleClose}
        type="button"
      >
        <X aria-hidden="true" />
      </button>
    </header>
  );
}
