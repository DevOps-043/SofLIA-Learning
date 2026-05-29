"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { buildClientTurnId, createRequestController, parseDialogueResponse } from "./dialogue-api";
import type { DialogueMessageResponse, DialogueSession } from "./dialogue.types";

interface UseDialogueMessageSenderParams {
  draftMessage: string;
  endpointBase: string;
  isTerminal: boolean;
  onSessionUpdated?: () => void | Promise<void>;
  sending: boolean;
  session: DialogueSession | null;
  setDraftMessage: Dispatch<SetStateAction<string>>;
  setError: (message: string | null) => void;
  setSending: (sending: boolean) => void;
  setSession: (session: DialogueSession) => void;
  t: (key: string) => string;
}

export function useDialogueMessageSender({
  draftMessage,
  endpointBase,
  isTerminal,
  onSessionUpdated,
  sending,
  session,
  setDraftMessage,
  setError,
  setSending,
  setSession,
  t,
}: UseDialogueMessageSenderParams) {
  return useCallback(async () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || sending || isTerminal) return;

    try {
      setSending(true);
      setError(null);
      const request = createRequestController(45000);

      try {
        const response = await fetch(`${endpointBase}/message`, {
          body: JSON.stringify({ clientTurnId: buildClientTurnId(), message: trimmedMessage, sessionId: session?.sessionId }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: request.controller.signal,
        });
        const payload = await parseDialogueResponse<DialogueMessageResponse>(response);
        setSession(payload.session);
        setDraftMessage("");

        const sessionClosed = ["COMPLETE", "SESSION_SUMMARY", "FAIL_OR_RETRY"].includes(payload.session.state);
        if (sessionClosed) void Promise.resolve(onSessionUpdated?.()).catch(() => undefined);
      } finally {
        request.clear();
      }
    } catch (sendError) {
      setError(
        sendError instanceof DOMException && sendError.name === "AbortError"
          ? t("activities.dialogue.errors.sendTimeout")
          : sendError instanceof Error
          ? sendError.message
          : t("activities.dialogue.errors.sendFailed"),
      );
    } finally {
      setSending(false);
    }
  }, [draftMessage, endpointBase, isTerminal, onSessionUpdated, sending, session?.sessionId, setDraftMessage, setError, setSending, setSession, t]);
}
