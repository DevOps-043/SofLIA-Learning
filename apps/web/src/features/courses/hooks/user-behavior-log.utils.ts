import type { LearnLesson } from "../components/learn/types";

import {
  buildAttemptedLessonChangeMessage,
  buildBlockedLessonsMessage,
  buildFailedAttemptsMessage,
  buildInactivityMessage,
  buildMaterialsExplorationMessage,
  buildTabChangesMessage,
} from "./user-behavior-log.messages";

export interface BehaviorMetadata extends Record<string, unknown> {
  pendingActivities?: string;
  tab?: string;
}

export interface BehaviorLogEntry {
  action: string;
  timestamp: number;
  lessonId?: string;
  lessonTitle?: string;
  hasCompletedActivities?: boolean;
  activityDetails?: string;
  metadata?: BehaviorMetadata;
}

export function buildBehaviorLogEntry(
  action: string,
  currentLesson: LearnLesson | null,
  metadata?: BehaviorMetadata
): BehaviorLogEntry {
  return {
    action,
    timestamp: Date.now(),
    lessonId: currentLesson?.lesson_id,
    lessonTitle: currentLesson?.lesson_title,
    metadata,
  };
}

export function analyzeUserBehaviorEntries(userBehaviorLog: BehaviorLogEntry[]): string {
  const recentActions = userBehaviorLog.slice(-10);
  const now = Date.now();
  const last5Minutes = recentActions.filter((entry) => now - entry.timestamp < 300000);

  return [
    buildAttemptedLessonChangeMessage(last5Minutes),
    buildBlockedLessonsMessage(last5Minutes),
    buildMaterialsExplorationMessage(last5Minutes),
    buildTabChangesMessage(last5Minutes),
    buildInactivityMessage(recentActions, now),
    buildFailedAttemptsMessage(last5Minutes),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}
