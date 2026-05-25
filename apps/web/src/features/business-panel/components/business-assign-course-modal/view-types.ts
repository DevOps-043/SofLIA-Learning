import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme';
import { useBusinessAssignCourseModal } from './useBusinessAssignCourseModal';

export type BusinessAssignCourseModalState = ReturnType<typeof useBusinessAssignCourseModal>;
export type BusinessAssignCourseTheme = ReturnType<typeof useBusinessPanelTheme>;
export type AssignedUserSourceInfo =
  BusinessAssignCourseModalState['assignedUserSources'] extends Map<string, infer TValue>
    ? TValue
    : never;
