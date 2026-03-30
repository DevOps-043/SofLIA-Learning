"use client";

import { useState, useCallback } from "react";
import type { LearnLesson } from "../components/learn/types";

interface BehaviorLogEntry {
  action: string;
  timestamp: number;
  lessonId?: string;
  lessonTitle?: string;
  hasCompletedActivities?: boolean;
  activityDetails?: string;
  metadata?: any;
}

export function useUserBehaviorLog(currentLesson: LearnLesson | null) {
  const [userBehaviorLog, setUserBehaviorLog] = useState<BehaviorLogEntry[]>([]);

  const trackUserAction = useCallback(
    (action: string, metadata?: any) => {
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
    const last5Minutes = recentActions.filter((a) => now - a.timestamp < 300000);

    let behaviorContext = "";

    const lessonChangeAttempts = last5Minutes.filter(
      (a) => a.action === "attempted_lesson_change_without_completion"
    );
    if (lessonChangeAttempts.length > 0) {
      const attemptDetails = lessonChangeAttempts[lessonChangeAttempts.length - 1];
      behaviorContext += `El usuario ha intentado ${lessonChangeAttempts.length} veces cambiar a otra lección sin completar las actividades requeridas. `;
      behaviorContext += `Actividades pendientes: ${attemptDetails.metadata?.pendingActivities || "desconocidas"}. `;
    }

    const blockedAttempts = last5Minutes.filter(
      (a) => a.action === "attempted_locked_lesson"
    );
    if (blockedAttempts.length > 0) {
      behaviorContext += `Ha intentado ${blockedAttempts.length} veces acceder a lecciones bloqueadas. `;
    }

    const expandCollapseActions = last5Minutes.filter(
      (a) =>
        a.action === "expand_lesson_materials" ||
        a.action === "collapse_lesson_materials"
    );
    if (expandCollapseActions.length > 3) {
      behaviorContext += `Está explorando los materiales de forma repetitiva (${expandCollapseActions.length} veces en 5 min). `;
    }

    const tabChanges = last5Minutes.filter((a) => a.action === "tab_change");
    if (tabChanges.length > 5) {
      const tabs = tabChanges.map((a) => a.metadata?.tab).filter(Boolean);
      behaviorContext += `Ha cambiado de sección ${tabChanges.length} veces (${tabs.join(" → ")}), parece estar buscando algo específico. `;
    }

    if (recentActions.length > 0) {
      const lastAction = recentActions[recentActions.length - 1];
      const timeSinceLastAction = (now - lastAction.timestamp) / 1000;
      if (timeSinceLastAction > 120) {
        behaviorContext += `Lleva ${Math.floor(timeSinceLastAction / 60)} minutos en la misma acción sin interactuar. `;
      }
    }

    const failedAttempts = last5Minutes.filter(
      (a) => a.action === "activity_failed_attempt"
    );
    if (failedAttempts.length > 0) {
      behaviorContext += `Ha fallado ${failedAttempts.length} intentos en actividades. `;
    }

    return behaviorContext.trim();
  }, [userBehaviorLog]);

  return { userBehaviorLog, trackUserAction, analyzeUserBehavior };
}
