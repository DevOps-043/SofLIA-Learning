import { useCallback, useEffect, useState } from 'react';
import { fetchQuestionResponses, fetchQuestionThread } from './question-thread-api';
import { getResponseReactionState } from './question-thread-state';
import type { CourseQuestion, CourseQuestionResponse } from '../types';
import type { ResponseReactionCounts, ResponseReactions } from './types';

export function useQuestionThreadLoader(questionId: string, slug: string) {
  const [question, setQuestion] = useState<CourseQuestion | null>(null);
  const [responses, setResponses] = useState<CourseQuestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [responseReactions, setResponseReactions] = useState<ResponseReactions>({});
  const [responseReactionCounts, setResponseReactionCounts] = useState<ResponseReactionCounts>({});

  const syncResponseReactionState = useCallback((nextResponses: CourseQuestionResponse[]) => {
    const nextReactionState = getResponseReactionState(nextResponses);
    setResponseReactionCounts(nextReactionState.counts);
    setResponseReactions(nextReactionState.reactions);
  }, []);

  const loadResponses = useCallback(async () => {
    const nextResponses = await fetchQuestionResponses(slug, questionId);
    setResponses(nextResponses);
    syncResponseReactionState(nextResponses);
    setLoadingResponses(false);
  }, [questionId, slug, syncResponseReactionState]);

  useEffect(() => {
    let isActive = true;

    async function loadThread() {
      try {
        setLoading(true);
        setLoadingResponses(true);
        const snapshot = await fetchQuestionThread(slug, questionId);

        if (!isActive) {
          return;
        }

        setQuestion(snapshot.question);
        setResponses(snapshot.responses);
        syncResponseReactionState(snapshot.responses);
      } finally {
        if (isActive) {
          setLoading(false);
          setLoadingResponses(false);
        }
      }
    }

    void loadThread();

    return () => {
      isActive = false;
    };
  }, [questionId, slug, syncResponseReactionState]);

  return {
    loadResponses,
    loading,
    loadingResponses,
    question,
    responseReactionCounts,
    responseReactions,
    responses,
    setResponseReactionCounts,
    setResponseReactions,
    setResponses,
  };
}
