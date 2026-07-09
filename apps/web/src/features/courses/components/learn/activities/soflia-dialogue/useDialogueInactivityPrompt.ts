"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DIALOGUE_INACTIVITY_PROMPT_SECONDS } from "./dialogue-inactivity.constants";

interface UseDialogueInactivityPromptParams {
  /** Timer only runs while the dialogue is actionable (loaded, not terminal). */
  enabled: boolean;
  /**
   * Any change on these values counts as user activity and resets the timer
   * (e.g. draft message text, number of turns in the session).
   */
  activitySignals: ReadonlyArray<unknown>;
  promptAfterSeconds?: number;
}

/**
 * Shows an inactivity prompt after N seconds without dialogue activity.
 * Pure client-side timer: the server-side cron (5 min) only caps active time
 * and never terminates the session, so this is a UX nudge, not a lock.
 */
export function useDialogueInactivityPrompt({
  enabled,
  activitySignals,
  promptAfterSeconds = DIALOGUE_INACTIVITY_PROMPT_SECONDS,
}: UseDialogueInactivityPromptParams) {
  const [showInactivityPrompt, setShowInactivityPrompt] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissInactivityPrompt = useCallback(() => {
    setShowInactivityPrompt(false);
    // The reset effect below re-arms the timer because showInactivityPrompt
    // participates in its dependencies.
  }, []);

  useEffect(() => {
    clearTimer();

    if (!enabled || showInactivityPrompt) {
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setShowInactivityPrompt(true);
    }, promptAfterSeconds * 1000);

    return clearTimer;
    // activitySignals is intentionally spread: any signal change = activity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, showInactivityPrompt, promptAfterSeconds, clearTimer, ...activitySignals]);

  // Leaving the actionable state (terminal/loading) also hides a stale prompt.
  useEffect(() => {
    if (!enabled) {
      setShowInactivityPrompt(false);
    }
  }, [enabled]);

  return { dismissInactivityPrompt, showInactivityPrompt };
}
