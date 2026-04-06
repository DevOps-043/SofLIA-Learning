'use client';

/**
 * useResponseHandler
 *
 * Sub-hook extracted from useStudyPlannerLIALogic.
 * Owns the UI-response state group: modals, course selector, calendar,
 * approach / date pickers, saved plan data, and user/course context state.
 */

import { useState } from 'react';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';

export function useResponseHandler() {
  // Conversation UI
  const [showConversation, setShowConversation] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Course selector
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<StudyPlannerCourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Calendar UI
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [connectedCalendar, setConnectedCalendar] = useState<StudyPlannerCalendarProvider>(null);
  const [calendarSkipped, setCalendarSkipped] = useState(false);
  const [showCalendarConfig, setShowCalendarConfig] = useState(false);
  const [hasConfiguredCalendars, setHasConfiguredCalendars] = useState(false);

  // Approach / date modals
  const [studyApproach, setStudyApproach] = useState<StudyApproach | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [hasAskedApproach, setHasAskedApproach] = useState(false);
  const [hasAskedTargetDate, setHasAskedTargetDate] = useState(false);
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showApproachButtons, setShowApproachButtons] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);

  // Saved plan data
  const [savedLessonDistribution, setSavedLessonDistribution] = useState<StudyPlannerStoredLessonDistribution[]>([]);
  const [savedTargetDate, setSavedTargetDate] = useState<string | null>(null);
  const [savedTotalLessons, setSavedTotalLessons] = useState<number>(0);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [hasShownFinalSummary, setHasShownFinalSummary] = useState<boolean>(false);
  const [savedCalendarData, setSavedCalendarData] = useState<StudyPlannerCalendarDataMap | null>(null);

  // User / course context
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<StudyPlannerUserContext | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<StudyPlannerAssignedCourse[]>([]);
  const [pendingLessonsWithNames, setPendingLessonsWithNames] = useState<StudyPlannerPendingLesson[]>([]);

  return {
    // Conversation UI
    showConversation, setShowConversation,
    userMessage, setUserMessage,
    hoveredButton, setHoveredButton,

    // Course selector
    showCourseSelector, setShowCourseSelector,
    availableCourses, setAvailableCourses,
    selectedCourseIds, setSelectedCourseIds,
    isLoadingCourses, setIsLoadingCourses,
    courseSearchQuery, setCourseSearchQuery,

    // Calendar UI
    showCalendarModal, setShowCalendarModal,
    isConnectingCalendar, setIsConnectingCalendar,
    connectedCalendar, setConnectedCalendar,
    calendarSkipped, setCalendarSkipped,
    showCalendarConfig, setShowCalendarConfig,
    hasConfiguredCalendars, setHasConfiguredCalendars,

    // Approach / date
    studyApproach, setStudyApproach,
    targetDate, setTargetDate,
    hasAskedApproach, setHasAskedApproach,
    hasAskedTargetDate, setHasAskedTargetDate,
    showApproachModal, setShowApproachModal,
    showApproachButtons, setShowApproachButtons,
    showDateModal, setShowDateModal,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,

    // Saved plan data
    savedLessonDistribution, setSavedLessonDistribution,
    savedTargetDate, setSavedTargetDate,
    savedTotalLessons, setSavedTotalLessons,
    savedPlanId, setSavedPlanId,
    hasShownFinalSummary, setHasShownFinalSummary,
    savedCalendarData, setSavedCalendarData,

    // User / course context
    currentUserId, setCurrentUserId,
    userContext, setUserContext,
    assignedCourses, setAssignedCourses,
    pendingLessonsWithNames, setPendingLessonsWithNames,
  };
}
