import React from 'react';
import type { Step } from 'react-joyride';
import { BookOpen, Filter, LibraryBig, MousePointerClick, Rows3 } from 'lucide-react';

import { getNotebookTourTargetSelector } from '../../../core/constants/tourTargets';
import type { MinitourTranslator } from './profile-minitour-steps';

export const NOTEBOOK_MINITOUR_ID = 'notebook-minitour-v1';

const iconClassName = 'h-5 w-5 text-[var(--color-accent)]';

export function buildNotebookMinitourSteps(t: MinitourTranslator): Step[] {
  return [
    {
      target: getNotebookTourTargetSelector('toolbar'),
      title: t('notebookTour.steps.toolbar.title'),
      content: t('notebookTour.steps.toolbar.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <MousePointerClick className={iconClassName} /> },
    },
    {
      target: getNotebookTourTargetSelector('header'),
      title: t('notebookTour.steps.header.title'),
      content: t('notebookTour.steps.header.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <BookOpen className={iconClassName} /> },
    },
    {
      target: getNotebookTourTargetSelector('tabs'),
      title: t('notebookTour.steps.tabs.title'),
      content: t('notebookTour.steps.tabs.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <Rows3 className={iconClassName} /> },
    },
    {
      target: getNotebookTourTargetSelector('courseFilter'),
      title: t('notebookTour.steps.courseFilter.title'),
      content: t('notebookTour.steps.courseFilter.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <Filter className={iconClassName} /> },
    },
    {
      target: getNotebookTourTargetSelector('notesGrid'),
      title: t('notebookTour.steps.notesGrid.title'),
      content: t('notebookTour.steps.notesGrid.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <LibraryBig className={iconClassName} /> },
    },
  ];
}
