'use client';

import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';
import {
  BusinessAssignCourseConfig,
  BusinessAssignCourseError,
  BusinessAssignCourseFooter,
  BusinessAssignCourseFrame,
  BusinessAssignCourseHeader,
  BusinessAssignCourseUserSelection,
  type BusinessAssignCourseModalProps,
  useBusinessAssignCourseModal,
} from './business-assign-course-modal';

export function BusinessAssignCourseModal({
  courseId,
  courseTitle,
  isOpen,
  onAssignComplete,
  onClose,
  orgSlug,
}: BusinessAssignCourseModalProps) {
  const { t } = useTranslation('business');
  const theme = useBusinessPanelTheme();
  const modal = useBusinessAssignCourseModal({
    courseId,
    courseTitle,
    isOpen,
    onAssignComplete,
    onClose,
    orgSlug,
    t,
  });

  if (!isOpen) return null;

  return (
    <BusinessAssignCourseFrame modal={modal} theme={theme}>
      <BusinessAssignCourseHeader courseTitle={courseTitle} modal={modal} t={t} theme={theme} />
      <div className="flex-1 overflow-y-auto pt-8 pb-12 px-6 lg:px-12 space-y-10" style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}>
        <BusinessAssignCourseError modal={modal} theme={theme} />
        <BusinessAssignCourseUserSelection modal={modal} t={t} theme={theme} />
        <BusinessAssignCourseConfig modal={modal} t={t} theme={theme} />
      </div>
      <BusinessAssignCourseFooter modal={modal} t={t} theme={theme} />
    </BusinessAssignCourseFrame>
  );
}
