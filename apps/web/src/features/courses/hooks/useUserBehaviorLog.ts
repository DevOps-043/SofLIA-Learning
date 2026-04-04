"use client";

import { useState, useCallback } from "react";
import type { LearnLesson } from "../components/learn/types";

interface BehaviorMetadata extends Record<string, unknown> {
  pendingActivities?: string;
  tab?: string;
}

interface BehaviorLogEntry {
  action: string;
  timestamp: number;
  lessonId?: string;
  lessonTitle?: string;
  hasCompletedActivities?: boolean;
  activityDetails?: string;
  metadata?: BehaviorMetadata;
}

export function useUserBehaviorLog(currentLesson: LearnLesson | null) {
  const [userBehaviorLog, setUserBehaviorLog] = useState<BehaviorLogEntry[]>([]);

  const trackUserAction = useCallback(
    (action: string, metadata?: BehaviorMetadata) => {
      setUserBehaviorLog((prev) => {
        const newEntry: BehaviorLogEntry = {
          action,
          timestamp: Date.now(),
          lessonId: currentLesson?.lesson_id,
          lessonTitle: currentLesson?.lesson_title,
          metadata,
        };
        return [...prev, newEntry].slice(-50);
      });
    },
    [currentLesson]
  );

  const analyzeUserBehavior = useCallback((): string => {
    const recentActions = userBehaviorLog.slice(-10);
    const now = Date.now();
    const last5Minutes = recentActions.filter((entry) => now - entry.timestamp < 300000);

    let behaviorContext = "";

    const lessonChangeAttempts = last5Minutes.filter(
      (entry) => entry.action === "attempted_lesson_change_without_completion"
    );
    if (lessonChangeAttempts.length > 0) {
      const attemptDetails = lessonChangeAttempts[lessonChangeAttempts.length - 1];
      const pendingActivities =
        typeof attemptDetails.metadata?.pendingActivities === "string"
          ? attemptDetails.metadata.pendingActivities
          : "desconocidas";
      behaviorContext += `El usuario ha intentado ${lessonChangeAttempts.length} veces cambiar a otra leccion sin completar las actividades requeridas. `;
      behaviorContext += `Actividades pendientes: ${pendingActivities}. `;
    }

    const blockedAttempts = last5Minutes.filter(
      (entry) => entry.action === "attempted_locked_lesson"
    );
    if (blockedAttempts.length > 0) {
      behaviorContext += `Ha intentado ${blockedAttempts.length} veces acceder a lecciones bloqueadas. `;
    }

    const expandCollapseActions = last5Minutes.filter(
      (entry) =>
        entry.action === "expand_lesson_materials" ||
        entry.action === "collapse_lesson_materials"
    );
    if (expandCollapseActions.length > 3) {
      behaviorContext += `Esta explorando los materiales de forma repetitiva (${expandCollapseActions.length} veces en 5 min). `;
    }

    const tabChanges = last5Minutes.filter((entry) => entry.action === "tab_change");
    if (tabChanges.length > 5) {
      const tabs = tabChanges
        .map((entry) => (typeof entry.metadata?.tab === "string" ? entry.metadata.tab : null))
        .filter((tab): tab is string => Boolean(tab));
      behaviorContext += `Ha cambiado de seccion ${tabChanges.length} veces (${tabs.join(" -> ")}), parece estar buscando algo especifico. `;
    }

    if (recentActions.length > 0) {
      const lastAction = recentActions[recentActions.length - 1];
      const timeSinceLastAction = (now - lastAction.timestamp) / 1000;
      if (timeSinceLastAction > 120) {
        behaviorContext += `Lleva ${Math.floor(timeSinceLastAction / 60)} minutos en la misma accion sin interactuar. `;
      }
    }

    const failedAttempts = last5Minutes.filter(
      (entry) => entry.action === "activity_failed_attempt"
    );
    if (failedAttempts.length > 0) {
      behaviorContext += `Ha fallado ${failedAttempts.length} intentos en actividades. `;
    }

    return behaviorContext.trim();
  }, [userBehaviorLog]);

  return { userBehaviorLog, trackUserAction, analyzeUserBehavior };
}
