"use client";

import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { createRequestController, parseDialogueResponse } from "./dialogue-api";
import type { DialogueSession } from "./dialogue.types";

interface UseDialogueSessionLoaderParams {
  endpointBase: string;
  mountedRef: MutableRefObject<boolean>;
  setDraftMessage: Dispatch<SetStateAction<string>>;
  setError: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSession: (session: DialogueSession) => void;
  t: (key: string) => string;
}

export function useDialogueSessionLoader({
  endpointBase,
  mountedRef,
  setDraftMessage,
  setError,
  setLoading,
  setSession,
  t,
}: UseDialogueSessionLoaderParams) {
  return useCallback(async ({
    restart = false,
    showLoading = true,
  }: { restart?: boolean; showLoading?: boolean } = {}) => {
    const request = createRequestController(15000);

    try {
      if (showLoading && mountedRef.current) setLoading(true);
      if (mountedRef.current) setError(null);

      const response = await fetch(`${endpointBase}/session${restart ? "?restart=1" : ""}`, {
        cache: "no-store",
        credentials: "include",
        signal: request.controller.signal,
      });
      const payload = await parseDialogueResponse<{ session: DialogueSession }>(response);

      if (mountedRef.current) {
        setSession(payload.session);
        setDraftMessage("");
      }
    } catch (loadError) {
      if (mountedRef.current) {
        setError(
          loadError instanceof DOMException && loadError.name === "AbortError"
            ? t("activities.dialogue.errors.loadTimeout")
            : loadError instanceof Error
            ? loadError.message
            : t("activities.dialogue.errors.loadFailed"),
        );
      }
    } finally {
      request.clear();
      if (showLoading && mountedRef.current) setLoading(false);
    }
  }, [endpointBase, mountedRef, setDraftMessage, setError, setLoading, setSession, t]);
}
