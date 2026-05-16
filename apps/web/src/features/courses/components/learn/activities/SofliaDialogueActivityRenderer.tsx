"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAutoResizingTextarea } from "@/features/courses/hooks/useAutoResizingTextarea";
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

function getStateTone(state?: DialogueState) {
  if (state === "COMPLETE" || state === "SESSION_SUMMARY") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (state === "FAIL_OR_RETRY") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  }

  return "border-accent/30 bg-accent/10 text-primary dark:border-accent/20 dark:bg-accent/10 dark:text-accent";
}

function getUserDisplayName(user: {
  display_name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
} | null) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();

  return fullName || user?.display_name || user?.username || user?.email || "";
}

function getUserInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : displayName.slice(0, 2);

  return initials.toUpperCase() || "U";
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
  const { t } = useTranslation("learn");
  const { user } = useAuth();
  const [draftMessage, setDraftMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<DialogueSession | null>(null);
  const mountedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const resizeDraftTextarea = useAutoResizingTextarea({ minHeight: 24 });

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
              ? t("activities.dialogue.errors.loadTimeout")
              : loadError instanceof Error
              ? loadError.message
              : t("activities.dialogue.errors.loadFailed"),
          );
        }
      } finally {
        request.clear();
        if (showLoading && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [endpointBase, t],
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
          ? t("activities.dialogue.errors.sendTimeout")
          : sendError instanceof Error
          ? sendError.message
          : t("activities.dialogue.errors.sendFailed"),
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
    t,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages.length, sending]);

  useEffect(() => {
    resizeDraftTextarea(draftInputRef.current, 128);
  }, [draftMessage, resizeDraftTextarea]);

  const stateLabel = session?.state
    ? t(`activities.dialogue.states.${session.state}`, {
        defaultValue: session.state.replace(/_/g, " "),
      })
    : t("activities.dialogue.states.START");
  const scoreValue = Math.round(session?.score ?? session?.result?.score ?? 0);
  const totalCriteria =
    (session?.criteriaMet.length || 0) + (session?.criteriaMissing.length || 0);
  const criteriaProgress =
    totalCriteria > 0
      ? Math.round(((session?.criteriaMet.length || 0) / totalCriteria) * 100)
      : 0;
  const canSendMessage = Boolean(draftMessage.trim()) && !sending && !isTerminal;
  const userDisplayName =
    getUserDisplayName(user) || t("activities.dialogue.userLabel");
  const userInitials = getUserInitials(userDisplayName);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-white/60" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {t("activities.dialogue.loadingTitle")}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white/40">
            {t("activities.dialogue.loadingDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-accent/30 bg-accent/10">
              <img
                src="/lia-avatar.webp"
                alt="SofLIA"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("activities.dialogue.title")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/50">
                {t("activities.dialogue.subtitle")}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStateTone(session?.state)}`}
          >
            {canPracticeAgain ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : canRetry ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {stateLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-white/40">
              <Target className="h-3.5 w-3.5" />
              {t("activities.dialogue.metrics.criteria")}
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {session?.criteriaMet.length || 0}/{totalCriteria || 0}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${criteriaProgress}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-white/40">
              <MessageSquareText className="h-3.5 w-3.5" />
              {t("activities.dialogue.metrics.turns")}
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {session?.turnsCount || 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-white/40">
              <Clock3 className="h-3.5 w-3.5" />
              {t("activities.dialogue.metrics.score")}
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {scoreValue}%
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
        {session?.messages.length ? (
          session.messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role !== "user" ? (
                <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-accent/30 bg-accent/10">
                  <img
                    src="/lia-avatar.webp"
                    alt="SofLIA"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div
                className={`relative max-w-[86%] px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-primary text-white after:absolute after:right-[-5px] after:top-4 after:h-3 after:w-3 after:rotate-45 after:bg-primary dark:bg-accent dark:text-primary dark:after:bg-accent"
                    : "rounded-2xl rounded-tl-sm bg-gray-100 text-gray-800 before:absolute before:left-[-5px] before:top-4 before:h-3 before:w-3 before:rotate-45 before:bg-gray-100 dark:bg-white/10 dark:text-white dark:before:bg-gray-800"
                }`}
              >
                <div
                  className={`mb-1 text-[11px] font-semibold ${
                    message.role === "user"
                      ? "text-white/70 dark:text-primary/70"
                      : "text-gray-500 dark:text-white/50"
                  }`}
                >
                  {message.role === "user"
                    ? userDisplayName
                    : "SofLIA"}
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" ? (
                user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={userDisplayName}
                    className="mt-1 h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary dark:bg-accent/15 dark:text-accent">
                    {userInitials}
                  </div>
                )
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <Sparkles className="mx-auto h-5 w-5 text-gray-400 dark:text-white/40" />
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t("activities.dialogue.emptyTitle")}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/40">
              {t("activities.dialogue.emptyDescription")}
            </p>
          </div>
        )}

        {sending && (
          <div className="flex justify-start gap-2">
            <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-accent/30 bg-accent/10">
              <img
                src="/lia-avatar.webp"
                alt="SofLIA"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-white/10 dark:text-white/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("activities.dialogue.responding")}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3 border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        {session?.result && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("activities.dialogue.finalFeedback")}
              </p>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-white/60">
                {t("activities.dialogue.metrics.score")}: {Math.round(session.result.score)}%
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {session.result.studentFeedback}
            </p>
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
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
            {canPracticeAgain
              ? t("activities.dialogue.practiceAgain")
              : t("activities.dialogue.retryActivity")}
          </button>
        )}

        <div className="flex items-end gap-2 rounded-[22px] border border-gray-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-primary dark:border-white/10 dark:bg-gray-900 dark:focus-within:border-accent">
          <textarea
            ref={draftInputRef}
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            disabled={sending || isTerminal}
            rows={1}
            className="lia-textarea-scrollbar min-h-6 max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-white/40"
            placeholder={
              isTerminal
                ? t("activities.dialogue.closedPlaceholder")
                : t("activities.dialogue.placeholder")
            }
          />
          <button
            type="button"
            onClick={() => {
              void sendMessage();
            }}
            disabled={!canSendMessage}
            className="mb-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-accent dark:text-primary dark:disabled:bg-white/10 dark:disabled:text-white/35"
            title={t("activities.dialogue.send")}
            aria-label={t("activities.dialogue.send")}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-gray-500 dark:text-white/40">
          {isTerminal
            ? t("activities.dialogue.closedHelper")
            : t("activities.dialogue.helper")}
        </p>
      </div>
    </div>
  );
}
