import type {
  StudyPlannerCalendarDayAnalysis,
  StudyPlannerCalendarFreeSlotWithDay,
  StudyPlannerTargetWindow,
} from '../types/planner-schedule.types';
import type { StudyApproach } from '../types/planner-ui.types';
import type { OrganizationPlannerConfig } from './organization-planner-config.service';
import type { StudyPlannerAvailabilityEstimate } from './planner-calendar-analysis.service';

export interface SelectStudyPlannerFinalSlotsInput {
  currentTime: Date;
  daysAnalysis: StudyPlannerCalendarDayAnalysis[];
  hasOrganizationalDeadlines: boolean;
  organizationConfig?: OrganizationPlannerConfig | null;
  profileAvailability: StudyPlannerAvailabilityEstimate | null;
  skipB2BRedirect?: boolean;
  startDate: Date;
  studyApproach: StudyApproach | null;
  targetWindow: StudyPlannerTargetWindow;
  totalLessonsNeeded: number;
  userType?: 'b2b' | 'b2c' | null;
}

export interface SelectStudyPlannerFinalSlotsResult {
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
  weeklyAvailableMinutes: number;
}
