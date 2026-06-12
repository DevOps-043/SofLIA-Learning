"use client";

import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { createRequestController, parseDialogueResponse } from "./dialogue-api";
import type { DialogueSession } from "./dialogue.types";

interface UseDialogueSessionLoaderParams {
  endpointBase: string;
  mountedRef: MutableRefObject<boolean>;
  organizationId?: string | null;
  setDraftMessage: Dispatch<SetStateAction<string>>;
  setError: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSession: (session: DialogueSession) => void;
  t: (key: string) => string;
}

export function useDialogueSessionLoader({
  endpointBase,
  mountedRef,
  organizationId,
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

      const params = new URLSearchParams();
      if (restart) params.set("restart", "1");
      if (organizationId) params.set("orgId", organizationId);
      const query = params.toString();
      const response = await fetch(`${endpointBase}/session${query ? `?${query}` : ""}`, {
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
  }, [endpointBase, mountedRef, organizationId, setDraftMessage, setError, setLoading, setSession, t]);
}
