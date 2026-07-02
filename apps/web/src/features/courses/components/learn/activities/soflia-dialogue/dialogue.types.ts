import type { RefObject } from "react";
import type { DialogueState } from "@/features/courses/types/dialogue-runtime";
import type { LearnActivity } from "../../types";

export type DialogueMessage = {
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "system" | "user";
};

export type DialogueSession = {
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
  /** La sesión quedó bloqueada por fallos técnicos persistentes del evaluador; la UI debe ofrecer reiniciar. */
  stuckOnTechnicalFailure?: boolean;
  turnsCount: number;
};

export type DialogueMessageResponse = {
  assistantMessage: string;
  evaluationSummary?: { criteriaMet: string[]; criteriaMissing: string[]; score: number };
  result?: unknown;
  session: DialogueSession;
  state: DialogueState;
};

export type SofliaDialogueActivityRendererProps = {
  activity: LearnActivity;
  lessonId: string;
  onSessionUpdated?: () => void | Promise<void>;
  slug: string;
};

export type DialogueMessagesEndRef = RefObject<HTMLDivElement>;
