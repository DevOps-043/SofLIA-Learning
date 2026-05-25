'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CourseLiaFloatingButton } from './CourseLia/components/CourseLiaFloatingButton';
import { CourseLiaPanelContent } from './CourseLia/CourseLiaPanelContent';
import type { CourseLiaProps } from './CourseLia/types';

export function CourseLia(props: CourseLiaProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
