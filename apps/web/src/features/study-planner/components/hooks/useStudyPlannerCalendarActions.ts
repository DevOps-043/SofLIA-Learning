'use client';

import { useRef } from 'react';
import { useStudyPlannerB2BCalendarAnalysis } from '../../hooks/useStudyPlannerB2BCalendarAnalysis';
import {
  createAnalyzeCalendarAndSuggestHandler,
} from './study-planner-calendar-analysis.service';
import {
  createDisconnectCalendarHandler,
  createSkipCalendarConnectionHandler,
} from './study-planner-calendar-connection.service';
import type {
  StudyPlannerAnalyzeCalendarAndSuggest,
  UseStudyPlannerCalendarActionsParams,
} from './study-planner-calendar-actions.types';

export function useStudyPlannerCalendarActions({
  availableCourses,
  assignedCourses,
  isAudioEnabled,
  isProcessing,
  pendingLessonsRef,
  pendingLessonsWithNames,
  selectedCourseIds,
  setCalendarSkipped,
  setConnectedCalendar,
  setConversationHistory,
  setIsConnectingCalendar,
  setIsProcessing,
  setPendingLessonsWithNames,
  setSavedCalendarData,
  setSavedLessonDistribution,
  setSavedTargetDate,
  setSavedTotalLessons,
  setSelectedCourseIds,
  setShowCalendarModal,
  setTargetDate,
  setUserContext,
  speakText,
  studyApproach,
  targetDate,
  userContext,
  userId,
}: UseStudyPlannerCalendarActionsParams) {
  const analyzeCalendarAndSuggestRef =
    useRef<StudyPlannerAnalyzeCalendarAndSuggest>(async () => {});

  const { analyzeCalendarAndSuggestB2B } = useStudyPlannerB2BCalendarAnalysis({
    analyzeCalendarAndSuggest: (
      provider,
      effectiveTargetDate,
      effectiveApproach,
      skipB2BRedirect,
    ) =>
      analyzeCalendarAndSuggestRef.current(
        provider,
        effectiveTargetDate,
        effectiveApproach,
        skipB2BRedirect,
      ),
    pendingLessonsRef,
    selectedCourseIds,
    setConversationHistory,
    setIsProcessing,
    setPendingLessonsWithNames,
    setSelectedCourseIds,
    setTargetDate,
  });

  const analyzeCalendarAndSuggest = createAnalyzeCalendarAndSuggestHandler({
    analyzeCalendarAndSuggestB2B,
    availableCourses,
    assignedCourses,
    isAudioEnabled,
    isProcessing,
    pendingLessonsRef,
    pendingLessonsWithNames,
    selectedCourseIds,
    setCalendarSkipped,
    setConnectedCalendar,
    setConversationHistory,
    setIsConnectingCalendar,
    setIsProcessing,
    setPendingLessonsWithNames,
    setSavedCalendarData,
    setSavedLessonDistribution,
    setSavedTargetDate,
    setSavedTotalLessons,
    setSelectedCourseIds,
    setShowCalendarModal,
    setTargetDate,
    setUserContext,
    speakText,
    studyApproach,
    targetDate,
    userContext,
    userId,
  });

  analyzeCalendarAndSuggestRef.current = analyzeCalendarAndSuggest;

  return {
    analyzeCalendarAndSuggest,
    analyzeCalendarAndSuggestB2B,
    disconnectCalendar: createDisconnectCalendarHandler({
      isAudioEnabled,
      setConnectedCalendar,
      setConversationHistory,
      setIsConnectingCalendar,
      setShowCalendarModal,
      speakText,
    }),
    skipCalendarConnection: createSkipCalendarConnectionHandler({
      isAudioEnabled,
      setCalendarSkipped,
      setConversationHistory,
      setIsProcessing,
      setShowCalendarModal,
      setUserContext,
      speakText,
    }),
  };
}
