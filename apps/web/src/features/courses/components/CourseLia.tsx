'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CourseLiaFloatingButton } from './course-lia/CourseLiaFloatingButton';
import { CourseLiaPanelContent } from './course-lia/CourseLiaPanelContent';
import type { CourseLiaProps } from './course-lia/CourseLia.types';

export type { CourseLiaProps };

export function CourseLia(props: CourseLiaProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      <CourseLiaPanelContent {...props} />
      <CourseLiaFloatingButton />
    </>,
    document.body,
  );
}
