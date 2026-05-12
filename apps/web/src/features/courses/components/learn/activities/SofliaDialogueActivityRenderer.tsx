"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCcw, Send, Sparkles } from "lucide-react";

import type { DialogueState } from "@/features/courses/types/dialogue-runtime";

import type { LearnActivity } from "../types";

type DialogueMessage = {
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "system" | "user";
};

type DialogueSession = {
  completedAt: string | null;
  criteriaMet: string[];
  criteriaMissing: string[];
  hintsUsed: number;
  messages: DialogueMessage[];
  result: {
    activityResult: "completed" | "needs_retry";
    criteriaMet: string[];
    criteriaMissing: string[];
    score: number;
    studentFeedback: string;
  } | null;
  score: number;
  sessionId: string;
  startedAt: string;
  state: DialogueState;
  turnsCount: number;
};

type DialogueMessageResponse = {
  assistantMessage: string;
  evaluationSummary?: {
    criteriaMet: string[];
    criteriaMissing: string[];
    score: number;
  };
  result?: unknown;
  session: DialogueSession;
  state: DialogueState;
};

function buildClientTurnId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `turn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createRequestController(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    clear: () => window.clearTimeout(timeoutId),
  };
}

async function parseDialogueResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : "No fue posible procesar el dialogo.";
    throw new Error(message);
  }

  return payload as T;
}

export function SofliaDialogueActivityRenderer({
  activity,
  lessonId,
  onSessionUpdated,
  slug,
}: {
  activity: LearnActivity;
  lessonId: string;
  onSessionUpdated?: () => void | Promise<void>;
  slug: string;
}) {
  const [draftMessage, setDraftMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<DialogueSession | null>(null);
  const mountedRef = useRef(false);

  const endpointBase = useMemo(
    () =>
      `/api/courses/${slug}/lessons/${lessonId}/activities/${activity.activity_id}/dialogue`,
    [activity.activity_id, lessonId, slug],
  );

  const loadSession = useCallback(
    async ({
      restart = false,
      showLoading = true,
    }: { restart?: boolean; showLoading?: boolean } = {}) => {
      const request = createRequestController(15000);

      try {
        if (showLoading && mountedRef.current) {
          setLoading(true);
        }
        if (mountedRef.current) {
          setError(null);
        }

        const response = await fetch(
          `${endpointBase}/session${restart ? "?restart=1" : ""}`,
          {
          cache: "no-store",
          credentials: "include",
          signal: request.controller.signal,
          },
        );
        const payload = await parseDialogueResponse<{ session: DialogueSession }>(
          response,
        );

        if (mountedRef.current) {
          setSession(payload.session);
          setDraftMessage("");
        }
      } catch (loadError) {
        if (mountedRef.current) {
          setError(
            loadError instanceof DOMException && loadError.name === "AbortError"
              ? "La sesion tardo demasiado en cargar. Recarga la pagina o intenta de nuevo."
              : loadError instanceof Error
              ? loadError.message
              : "No fue posible cargar el dialogo.",
          );
        }
      } finally {
        request.clear();
        if (showLoading && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [endpointBase],
  );

  useEffect(() => {
    mountedRef.current = true;

    void loadSession();

    return () => {
      mountedRef.current = false;
    };
  }, [loadSession]);

  const canRetry =
    session?.state === "FAIL_OR_RETRY" &&
    session.result?.activityResult === "needs_retry";
  const canPracticeAgain = session?.result?.activityResult === "completed";
  const canStartNewAttempt = canRetry || canPracticeAgain;

  const isTerminal =
    session?.state === "COMPLETE" ||
    session?.state === "SESSION_SUMMARY" ||
    canRetry;

  const sendMessage = useCallback(async () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || sending || isTerminal) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      const request = createRequestController(45000);

      try {
        const response = await fetch(`${endpointBase}/message`, {
          body: JSON.stringify({
            clientTurnId: buildClientTurnId(),
            message: trimmedMessage,
            sessionId: session?.sessionId,
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: request.controller.signal,
        });

        const payload =
          await parseDialogueResponse<DialogueMessageResponse>(response);
        setSession(payload.session);
        setDraftMessage("");

        const sessionClosed =
          payload.session.state === "COMPLETE" ||
          payload.session.state === "SESSION_SUMMARY" ||
          payload.session.state === "FAIL_OR_RETRY";

        if (sessionClosed) {
          void Promise.resolve(onSessionUpdated?.()).catch(() => undefined);
        }
      } finally {
        request.clear();
      }
    } catch (sendError) {
      setError(
        sendError instanceof DOMException && sendError.name === "AbortError"
          ? "SofLIA tardo demasiado en responder. Tu respuesta pudo guardarse; reintenta o recarga la sesion."
          : sendError instanceof Error
          ? sendError.message
          : "No fue posible enviar tu respuesta.",
      );
    } finally {
      setSending(false);
    }
  }, [
    draftMessage,
    endpointBase,
    isTerminal,
    onSessionUpdated,
    sending,
    session?.sessionId,
  ]);

  const retrySession = useCallback(async () => {
    if (!canStartNewAttempt || loading || sending) {
      return;
    }

    try {
      setSending(true);
      await loadSession({ restart: true, showLoading: false });
    } finally {
      setSending(false);
    }
  }, [canStartNewAttempt, loadSession, loading, sending]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando dialogo SofLIA...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(canPracticeAgain || canRetry) && (
        <div className="flex flex-wrap items-center gap-2">
          {canPracticeAgain && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completado
            </span>
          )}
          {canRetry && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Reintento disponible
            </span>
          )}
        </div>
      )}

      <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-gray-900">
        {session?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-primary text-white dark:bg-accent dark:text-primary"
                  : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white"
              }`}
            >
              {message.role !== "user" && (
                <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-gray-500 dark:text-white/50">
                  <Sparkles className="h-3 w-3" />
                  SofLIA
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {session?.result && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Retroalimentacion final
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {session.result.studentFeedback}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {canStartNewAttempt && (
        <button
          type="button"
          onClick={() => {
            void retrySession();
          }}
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          {canPracticeAgain ? "Practicar de nuevo" : "Reintentar actividad"}
        </button>
      )}

      <div className="flex gap-2">
        <textarea
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          disabled={sending || isTerminal}
          rows={2}
          className="min-h-[48px] flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:focus:border-accent"
          placeholder={
            isTerminal
              ? "Esta sesion ya fue cerrada."
              : "Escribe tu respuesta para SofLIA..."
          }
        />
        <button
          type="button"
          onClick={() => {
            void sendMessage();
          }}
          disabled={sending || isTerminal || !draftMessage.trim()}
          className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent dark:text-primary"
          title="Enviar respuesta"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
