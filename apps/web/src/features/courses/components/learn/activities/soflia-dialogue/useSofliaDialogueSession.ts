"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import { getDialogueMetrics, isDialogueTerminal } from "./dialogue-state";
import type { DialogueSession } from "./dialogue.types";
import { useDialogueMessageSender } from "./useDialogueMessageSender";
import { useDialogueSessionLoader } from "./useDialogueSessionLoader";

interface UseSofliaDialogueSessionParams {
  activityId: string;
  lessonId: string;
  onSessionUpdated?: () => void | Promise<void>;
  slug: string;
}

export function useSofliaDialogueSession({
  activityId,
  lessonId,
  onSessionUpdated,
  slug,
}: UseSofliaDialogueSessionParams) {
  const { t } = useTranslation("learn");
  const params = useParams();
  const currentOrganizationId = useCurrentOrganizationId();
  const routeOrgSlug = params?.orgSlug;
  const organizationId = routeOrgSlug ? currentOrganizationId : null;
  const [draftMessage, setDraftMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<DialogueSession | null>(null);
  const mountedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const endpointBase = useMemo(
    () => `/api/courses/${slug}/lessons/${lessonId}/activities/${activityId}/dialogue`,
    [activityId, lessonId, slug],
  );
  const loadSession = useDialogueSessionLoader({ endpointBase, mountedRef, organizationId, setDraftMessage, setError, setLoading, setSession, t });
  const canRetry = session?.state === "FAIL_OR_RETRY" && session.result?.activityResult === "needs_retry";
  const canPracticeAgain = session?.result?.activityResult === "completed";
  // Una sesión bloqueada por fallos técnicos del evaluador también debe poder reiniciarse
  // (no consume intentos: el backend solo cuenta sesiones terminales como intento).
  const isStuckOnTechnicalFailure = Boolean(session?.stuckOnTechnicalFailure) && !session?.result;
  const canStartNewAttempt = Boolean(canRetry || canPracticeAgain || isStuckOnTechnicalFailure);
  const isTerminal = isDialogueTerminal(session, Boolean(canRetry));
  const sendMessage = useDialogueMessageSender({ draftMessage, endpointBase, isTerminal, onSessionUpdated, organizationId, sending, session, setDraftMessage, setError, setSending, setSession, t });
  const retrySession = useCallback(async () => {
    if (!canStartNewAttempt || loading || sending) return;

    try {
      setSending(true);
      await loadSession({ restart: true, showLoading: false });
    } finally {
      setSending(false);
    }
  }, [canStartNewAttempt, loadSession, loading, sending]);

  useEffect(() => {
    mountedRef.current = true;
    void loadSession();
    return () => {
      mountedRef.current = false;
    };
  }, [loadSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages.length, sending]);

  const stateLabel = session?.state
    ? t(`activities.dialogue.states.${session.state}`, { defaultValue: session.state.replace(/_/g, " ") })
    : t("activities.dialogue.states.START");
  const metrics = getDialogueMetrics(session);
  const canSendMessage = Boolean(draftMessage.trim()) && !sending && !isTerminal;

  return { canPracticeAgain, canRetry, canSendMessage, canStartNewAttempt, draftMessage, error, isTerminal, loading, messagesEndRef, retrySession, sendMessage, sending, session, setDraftMessage, stateLabel, ...metrics };
}
