'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification';
import { useLiaCourse } from '@/features/courses/context/LiaCourseContext';

import { CourseLiaFloatingButton } from './CourseLia/components/CourseLiaFloatingButton';
import { CourseLiaPanelContent } from './CourseLia/CourseLiaPanelContent';
import { COURSE_LIA_PANEL_PORTAL_ID } from './CourseLia/constants';
import type { CourseLiaProps } from './CourseLia/types';

export function CourseLia(props: CourseLiaProps) {
  const [mounted, setMounted] = useState(false);
  const { liaToastMessage, setLiaToastMessage } = useLiaCourse();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const panelPortalTarget =
    document.getElementById(COURSE_LIA_PANEL_PORTAL_ID) ?? document.body;

  return (
    <>
      {createPortal(<CourseLiaPanelContent {...props} />, panelPortalTarget)}
      {createPortal(
        <>
          <CourseLiaFloatingButton />
          <ToastNotification
            isOpen={!!liaToastMessage}
            onClose={() => setLiaToastMessage(null)}
            message={liaToastMessage || ''}
            type="info"
            duration={3000}
          />
        </>,
        document.body,
      )}
    </>
  );
}
