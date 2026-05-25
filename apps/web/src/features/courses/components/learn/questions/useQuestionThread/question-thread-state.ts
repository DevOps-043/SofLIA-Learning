import { collectResponseReactionState } from '../utils';
import type { CourseQuestionResponse } from '../types';
import type { ResponseReactionCounts, ResponseReactions } from './types';

export function normalizeResponses(payload: unknown): CourseQuestionResponse[] {
  return Array.isArray(payload) ? (payload as CourseQuestionResponse[]) : [];
}

export function getResponseReactionState(nextResponses: CourseQuestionResponse[]): {
  counts: ResponseReactionCounts;
  reactions: ResponseReactions;
} {
  return collectResponseReactionState(nextResponses);
}

export function setReactionState(
  responseId: string,
  reaction: string | null | undefined,
  currentReactions: ResponseReactions
): ResponseReactions {
  const nextReactions = { ...currentReactions };

  if (!reaction) {
    delete nextReactions[responseId];
    return nextReactions;
  }

  nextReactions[responseId] = reaction;
  return nextReactions;
}
