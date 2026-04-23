"use client";

import { useCallback, useState } from "react";

import type { LearnLesson } from "../components/learn/types";
import {
  analyzeUserBehaviorEntries,
  buildBehaviorLogEntry,
  type BehaviorLogEntry,
  type BehaviorMetadata,
} from "./user-behavior-log.utils";

export function useUserBehaviorLog(currentLesson: LearnLesson | null) {
  const [userBehaviorLog, setUserBehaviorLog] = useState<BehaviorLogEntry[]>([]);

  const trackUserAction = useCallback(
    (action: string, metadata?: BehaviorMetadata) => {
      setUserBehaviorLog((prev) => {
        const newEntry = buildBehaviorLogEntry(action, currentLesson, metadata);
        return [...prev, newEntry].slice(-50);
      });
    },
    [currentLesson]
  );

  const analyzeUserBehavior = useCallback(
    () => analyzeUserBehaviorEntries(userBehaviorLog),
    [userBehaviorLog]
  );

  return { userBehaviorLog, trackUserAction, analyzeUserBehavior };
}
