'use client';

import { useAutosizeTextarea } from './useQuestionThread/useAutosizeTextarea';
import { useQuestionRealtime } from './useQuestionThread/useQuestionRealtime';
import { useQuestionThreadLoader } from './useQuestionThread/useQuestionThreadLoader';
import { useResponseComposer } from './useQuestionThread/useResponseComposer';
import { useResponseReactionHandler } from './useQuestionThread/useResponseReactionHandler';
import type { UseQuestionThreadOptions } from './useQuestionThread/types';

export function useQuestionThread({ questionId, slug }: UseQuestionThreadOptions) {
  const loader = useQuestionThreadLoader(questionId, slug);
  const composer = useResponseComposer({ questionId, setResponses: loader.setResponses, slug });
  const textareaRef = useAutosizeTextarea(composer.newResponse);
  const handleResponseReaction = useResponseReactionHandler({
    questionId,
    responseReactionCounts: loader.responseReactionCounts,
    responseReactions: loader.responseReactions,
    setResponseReactionCounts: loader.setResponseReactionCounts,
    setResponseReactions: loader.setResponseReactions,
    slug,
  });

  useQuestionRealtime({
    loadResponses: loader.loadResponses,
    questionId,
    setResponseReactionCounts: loader.setResponseReactionCounts,
    setResponses: loader.setResponses,
  });

  return {
    handleResponseReaction,
    handleSubmitReply: composer.handleSubmitReply,
    handleSubmitResponse: composer.handleSubmitResponse,
    isSubmitting: composer.isSubmitting,
    loading: loader.loading,
    loadingResponses: loader.loadingResponses,
    newResponse: composer.newResponse,
    question: loader.question,
    replyContent: composer.replyContent,
    replyingTo: composer.replyingTo,
    responseReactionCounts: loader.responseReactionCounts,
    responseReactions: loader.responseReactions,
    responses: loader.responses,
    setNewResponse: composer.setNewResponse,
    setReplyContent: composer.setReplyContent,
    setReplyingTo: composer.setReplyingTo,
    textareaRef,
  };
}
