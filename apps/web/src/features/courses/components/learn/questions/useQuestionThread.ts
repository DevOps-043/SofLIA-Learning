"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "../../../../../lib/supabase/client";

import type {
  CourseQuestion,
  CourseQuestionResponse,
  QuestionReactionResult,
} from "./types";
import {
  appendReplyToResponseTree,
  collectResponseReactionState,
  removeResponseFromTree,
  updateResponseInTree,
} from "./utils";

type UseQuestionThreadOptions = {
  questionId: string;
  slug: string;
};

function normalizeResponses(payload: unknown) {
  return Array.isArray(payload) ? (payload as CourseQuestionResponse[]) : [];
}

export function useQuestionThread({
  questionId,
  slug,
}: UseQuestionThreadOptions) {
  const [question, setQuestion] = useState<CourseQuestion | null>(null);
  const [responses, setResponses] = useState<CourseQuestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [newResponse, setNewResponse] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseReactions, setResponseReactions] = useState<
    Record<string, string>
  >({});
  const [responseReactionCounts, setResponseReactionCounts] = useState<
    Record<string, number>
  >({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncResponseReactionState = useCallback(
    (nextResponses: CourseQuestionResponse[]) => {
      const nextReactionState = collectResponseReactionState(nextResponses);
      setResponseReactionCounts(nextReactionState.counts);
      setResponseReactions(nextReactionState.reactions);
    },
    []
  );

  const adjustTextareaHeight = useCallback(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    const minHeight = 40;
    const maxHeight = 200;
    const nextHeight = Math.min(
      Math.max(textareaRef.current.scrollHeight, minHeight),
      maxHeight
    );

    textareaRef.current.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, newResponse]);

  const loadResponses = useCallback(async () => {
    const response = await fetch(
      `/api/courses/${slug}/questions/${questionId}/responses`
    );

    if (!response.ok) {
      setResponses([]);
      setLoadingResponses(false);
      return;
    }

    const nextResponses = normalizeResponses(await response.json());
    setResponses(nextResponses);
    syncResponseReactionState(nextResponses);
    setLoadingResponses(false);
  }, [questionId, slug, syncResponseReactionState]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        setLoading(true);
        setLoadingResponses(true);

        const [questionResponse, responsesResponse] = await Promise.all([
          fetch(`/api/courses/${slug}/questions/${questionId}`),
          fetch(`/api/courses/${slug}/questions/${questionId}/responses`),
        ]);

        if (!isActive) {
          return;
        }

        if (questionResponse.ok) {
          setQuestion((await questionResponse.json()) as CourseQuestion);
        } else {
          setQuestion(null);
        }

        if (responsesResponse.ok) {
          const nextResponses = normalizeResponses(await responsesResponse.json());
          setResponses(nextResponses);
          syncResponseReactionState(nextResponses);
        } else {
          setResponses([]);
          setResponseReactionCounts({});
          setResponseReactions({});
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setLoadingResponses(false);
        }
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [questionId, slug, syncResponseReactionState]);

  useEffect(() => {
    if (!questionId) {
      return;
    }

    const supabase = createClient();

    const responsesChannel = supabase
      .channel(`question-responses-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_responses",
          filter: `question_id=eq.${questionId}`,
        },
        async () => {
          await loadResponses();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "course_question_responses",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          const nextValues =
            payload.new as Partial<CourseQuestionResponse> & { id?: string };
          if (!nextValues.id) {
            return;
          }

          setResponses((currentResponses) =>
            updateResponseInTree(currentResponses, nextValues.id!, (response) => ({
              ...response,
              ...nextValues,
            }))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_responses",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          const deletedResponseId = String(
            (payload.old as { id?: string }).id || ""
          );
          if (!deletedResponseId) {
            return;
          }

          setResponses((currentResponses) =>
            removeResponseFromTree(currentResponses, deletedResponseId)
          );
        }
      )
      .subscribe();

    const responseReactionsChannel = supabase
      .channel(`response-reactions-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_reactions",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          const responseId = String(
            (payload.new as { response_id?: string }).response_id || ""
          );
          if (!responseId) {
            return;
          }

          setResponseReactionCounts((currentCounts) => ({
            ...currentCounts,
            [responseId]: (currentCounts[responseId] || 0) + 1,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_reactions",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          const responseId = String(
            (payload.old as { response_id?: string }).response_id || ""
          );
          if (!responseId) {
            return;
          }

          setResponseReactionCounts((currentCounts) => ({
            ...currentCounts,
            [responseId]: Math.max(0, (currentCounts[responseId] || 0) - 1),
          }));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(responsesChannel);
      void supabase.removeChannel(responseReactionsChannel);
    };
  }, [loadResponses, questionId]);

  const handleResponseReaction = useCallback(
    async (responseId: string) => {
      const currentReaction = responseReactions[responseId];
      const isCurrentlyLiked = currentReaction === "like";
      const currentCount = responseReactionCounts[responseId] ?? 0;
      const nextCount = isCurrentlyLiked
        ? Math.max(0, currentCount - 1)
        : currentCount + 1;

      setResponseReactionCounts((currentCounts) => ({
        ...currentCounts,
        [responseId]: nextCount,
      }));
      setResponseReactions((currentReactions) => {
        if (isCurrentlyLiked) {
          const nextReactions = { ...currentReactions };
          delete nextReactions[responseId];
          return nextReactions;
        }

        return {
          ...currentReactions,
          [responseId]: "like",
        };
      });

      try {
        const response = await fetch(
          `/api/courses/${slug}/questions/${questionId}/responses/${responseId}/reactions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reaction_type: "like",
              action: "toggle",
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to toggle response reaction");
        }

        const result = (await response.json()) as QuestionReactionResult;
        setResponseReactionCounts((currentCounts) => ({
          ...currentCounts,
          [responseId]: result.new_count ?? currentCount,
        }));
        setResponseReactions((currentReactions) => {
          if (!result.user_reaction) {
            const nextReactions = { ...currentReactions };
            delete nextReactions[responseId];
            return nextReactions;
          }

          return {
            ...currentReactions,
            [responseId]: result.user_reaction,
          };
        });
      } catch {
        setResponseReactionCounts((currentCounts) => ({
          ...currentCounts,
          [responseId]: currentCount,
        }));
        setResponseReactions((currentReactions) => {
          if (!currentReaction) {
            const nextReactions = { ...currentReactions };
            delete nextReactions[responseId];
            return nextReactions;
          }

          return {
            ...currentReactions,
            [responseId]: currentReaction,
          };
        });
      }
    },
    [questionId, responseReactionCounts, responseReactions, slug]
  );

  const handleSubmitResponse = useCallback(async () => {
    if (!newResponse.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/courses/${slug}/questions/${questionId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newResponse.trim() }),
        }
      );

      if (!response.ok) {
        return;
      }

      const createdResponse = (await response.json()) as CourseQuestionResponse;
      setResponses((currentResponses) => {
        if (currentResponses.some((responseItem) => responseItem.id === createdResponse.id)) {
          return currentResponses;
        }

        return [...currentResponses, { ...createdResponse, replies: [] }];
      });
      setNewResponse("");
    } finally {
      setIsSubmitting(false);
    }
  }, [newResponse, questionId, slug]);

  const handleSubmitReply = useCallback(
    async (parentId: string) => {
      if (!replyContent.trim()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(
          `/api/courses/${slug}/questions/${questionId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: replyContent.trim(),
              parent_response_id: parentId,
            }),
          }
        );

        if (!response.ok) {
          return;
        }

        const createdReply = (await response.json()) as CourseQuestionResponse;
        setResponses((currentResponses) =>
          appendReplyToResponseTree(currentResponses, parentId, {
            ...createdReply,
            replies: [],
          })
        );
        setReplyContent("");
        setReplyingTo(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    [questionId, replyContent, slug]
  );

  return {
    handleResponseReaction,
    handleSubmitReply,
    handleSubmitResponse,
    isSubmitting,
    loading,
    loadingResponses,
    newResponse,
    question,
    replyContent,
    replyingTo,
    responseReactionCounts,
    responseReactions,
    responses,
    setNewResponse,
    setReplyContent,
    setReplyingTo,
    textareaRef,
  };
}
