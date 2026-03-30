"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../../../lib/supabase/client";
import { fetchCourseQuestions, fetchQuestionById, toggleQuestionReaction } from "./api";
import type { CourseQuestion } from "./types";
import { collectQuestionReactionMaps, mergeQuestions } from "./utils";
const QUESTION_PAGE_SIZE = 20;
type UseCourseQuestionsOptions = { slug: string };

export function useCourseQuestions({ slug }: UseCourseQuestionsOptions) {
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [courseId, setCourseId] = useState<string | null>(null);

  const applyQuestionReactionCount = useCallback(
    (questionId: string, count: number) => {
      setReactionCounts((currentReactionCounts) => ({
        ...currentReactionCounts,
        [questionId]: count,
      }));
      setQuestions((currentQuestions) =>
        currentQuestions.map((question) =>
          question.id === questionId
            ? { ...question, reaction_count: count }
            : question
        )
      );
    },
    []
  );

  const syncQuestionMaps = useCallback((nextQuestions: CourseQuestion[]) => {
    const {
      reactionCounts: nextReactionCounts,
      userReactions: nextUserReactions,
    } = collectQuestionReactionMaps(nextQuestions);
    setReactionCounts(nextReactionCounts);
    setUserReactions(nextUserReactions);
  }, []);

  const reloadQuestions = useCallback(async () => {
    if (!slug) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
      const nextQuestions = await fetchCourseQuestions({
        slug,
        search: activeSearchQuery,
        limit: QUESTION_PAGE_SIZE,
        offset: 0,
      });

      if (nextQuestions.length === 0) {
        setQuestions([]);
        setHasMore(false);
        return;
      }
      setQuestions(nextQuestions);
      syncQuestionMaps(nextQuestions);

      if (nextQuestions.length > 0 && nextQuestions[0].course_id && !courseId) {
        setCourseId(nextQuestions[0].course_id);
      }

      setHasMore(nextQuestions.length === QUESTION_PAGE_SIZE);
    } catch {
      setQuestions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeSearchQuery, courseId, slug, syncQuestionMaps]);

  useEffect(() => {
    void reloadQuestions();
  }, [reloadQuestions]);

  useEffect(() => {
    if (!courseId) {
      return;
    }

    const supabase = createClient();

    const questionsChannel = supabase
      .channel(`course-questions-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_questions",
          filter: `course_id=eq.${courseId}`,
        },
        async (payload) => {
          if (activeSearchQuery) {
            return;
          }

          const newQuestionId = String((payload.new as { id?: string }).id || "");
          if (!newQuestionId) {
            return;
          }

          try {
            const newQuestion = await fetchQuestionById({
              slug,
              questionId: newQuestionId,
            });
            if (!newQuestion) {
              await reloadQuestions();
              return;
            }
            setQuestions((currentQuestions) => {
              if (currentQuestions.some((question) => question.id === newQuestion.id)) {
                return currentQuestions;
              }
              return [newQuestion, ...currentQuestions];
            });
            if (newQuestion.course_id && !courseId) {
              setCourseId(newQuestion.course_id);
            }
          } catch {
            await reloadQuestions();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "course_questions",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const nextValues = payload.new as Partial<CourseQuestion> & { id?: string };
          if (!nextValues.id) {
            return;
          }

          setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
              question.id === nextValues.id
                ? {
                    ...question,
                    ...nextValues,
                    updated_at: nextValues.updated_at || question.updated_at,
                  }
                : question
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_questions",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const deletedQuestionId = String((payload.old as { id?: string }).id || "");
          if (!deletedQuestionId) {
            return;
          }

          setQuestions((currentQuestions) =>
            currentQuestions.filter((question) => question.id !== deletedQuestionId)
          );
        }
      )
      .subscribe();

    const responsesChannel = supabase
      .channel(`course-responses-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_responses",
        },
        (payload) => {
          const questionId = String(
            (payload.new as { question_id?: string }).question_id || ""
          );
          if (!questionId) {
            return;
          }

          setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
              question.id === questionId
                ? { ...question, response_count: (question.response_count || 0) + 1 }
                : question
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_responses",
        },
        (payload) => {
          const questionId = String(
            (payload.old as { question_id?: string }).question_id || ""
          );
          if (!questionId) {
            return;
          }

          setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
              question.id === questionId
                ? {
                    ...question,
                    response_count: Math.max(0, (question.response_count || 0) - 1),
                  }
                : question
            )
          );
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel(`course-reactions-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_question_reactions",
        },
        (payload) => {
          const questionId = String(
            (payload.new as { question_id?: string }).question_id || ""
          );
          if (!questionId) {
            return;
          }

          setReactionCounts((currentReactionCounts) => {
            const nextCount = (currentReactionCounts[questionId] || 0) + 1;
            setQuestions((currentQuestions) =>
              currentQuestions.map((question) =>
                question.id === questionId
                  ? { ...question, reaction_count: nextCount }
                  : question
              )
            );
            return {
              ...currentReactionCounts,
              [questionId]: nextCount,
            };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "course_question_reactions",
        },
        (payload) => {
          const questionId = String(
            (payload.old as { question_id?: string }).question_id || ""
          );
          if (!questionId) {
            return;
          }

          setReactionCounts((currentReactionCounts) => {
            const nextCount = Math.max(
              0,
              (currentReactionCounts[questionId] || 0) - 1
            );
            setQuestions((currentQuestions) =>
              currentQuestions.map((question) =>
                question.id === questionId
                  ? { ...question, reaction_count: nextCount }
                  : question
              )
            );
            return {
              ...currentReactionCounts,
              [questionId]: nextCount,
            };
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(questionsChannel);
      void supabase.removeChannel(responsesChannel);
      void supabase.removeChannel(reactionsChannel);
    };
  }, [activeSearchQuery, courseId, reloadQuestions, slug]);

  const handleSearch = useCallback(() => {
    setActiveSearchQuery(searchQuery); setOffset(0); setHasMore(true);
  }, [searchQuery]);
  const handleClearSearch = useCallback(() => {
    setSearchQuery(""); setActiveSearchQuery(""); setOffset(0); setHasMore(true);
  }, []);

  const loadMoreQuestions = useCallback(async () => {
    if (!slug || loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      const nextOffset = offset + QUESTION_PAGE_SIZE;
      const nextQuestions = await fetchCourseQuestions({
        slug,
        search: activeSearchQuery,
        limit: QUESTION_PAGE_SIZE,
        offset: nextOffset,
      });
      if (nextQuestions.length === 0) {
        setHasMore(false);
        return;
      }

      setQuestions((currentQuestions) => mergeQuestions(currentQuestions, nextQuestions));

      const {
        reactionCounts: nextReactionCounts,
        userReactions: nextUserReactions,
      } = collectQuestionReactionMaps(nextQuestions);
      setReactionCounts((currentReactionCounts) => ({
        ...currentReactionCounts,
        ...nextReactionCounts,
      }));
      setUserReactions((currentUserReactions) => ({
        ...currentUserReactions,
        ...nextUserReactions,
      }));

      setOffset(nextOffset);
      setHasMore(nextQuestions.length === QUESTION_PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [activeSearchQuery, hasMore, loadingMore, offset, slug]);

  const handleReaction = useCallback(
    async (questionId: string) => {
      const currentReaction = userReactions[questionId];
      const isCurrentlyLiked = currentReaction === "like";
      const currentCount = reactionCounts[questionId] ?? 0;
      const nextCount = isCurrentlyLiked
        ? Math.max(0, currentCount - 1)
        : currentCount + 1;

      applyQuestionReactionCount(questionId, nextCount);
      setUserReactions((currentUserReactions) => {
        if (isCurrentlyLiked) {
          const nextUserReactions = { ...currentUserReactions };
          delete nextUserReactions[questionId];
          return nextUserReactions;
        }

        return {
          ...currentUserReactions,
          [questionId]: "like",
        };
      });

      try {
        const result = await toggleQuestionReaction({ slug, questionId });
        const serverCount = result.new_count ?? currentCount;

        applyQuestionReactionCount(questionId, serverCount);
        setUserReactions((currentUserReactions) => {
          if (!result.user_reaction) {
            const nextUserReactions = { ...currentUserReactions };
            delete nextUserReactions[questionId];
            return nextUserReactions;
          }

          return {
            ...currentUserReactions,
            [questionId]: result.user_reaction,
          };
        });
      } catch {
        applyQuestionReactionCount(questionId, currentCount);
        setUserReactions((currentUserReactions) => {
          if (currentReaction) {
            return {
              ...currentUserReactions,
              [questionId]: currentReaction,
            };
          }

          const nextUserReactions = { ...currentUserReactions };
          delete nextUserReactions[questionId];
          return nextUserReactions;
        });
      }
    },
    [applyQuestionReactionCount, reactionCounts, slug, userReactions]
  );

  const toggleQuestionSelection = useCallback(
    (questionId: string) =>
      setSelectedQuestionId((currentSelectedQuestionId) =>
        currentSelectedQuestionId === questionId ? null : questionId
      ),
    []
  );

  const handleQuestionCreated = useCallback(
    (question?: CourseQuestion) => {
      setShowCreateForm(false);

      if (!question) {
        void reloadQuestions();
        return;
      }

      setQuestions((currentQuestions) => {
        if (currentQuestions.some((currentQuestion) => currentQuestion.id === question.id)) {
          return currentQuestions;
        }
        return [question, ...currentQuestions];
      });

      setReactionCounts((currentReactionCounts) => ({
        ...currentReactionCounts,
        [question.id]: question.reaction_count || 0,
      }));

      if (question.user_reaction) {
        setUserReactions((currentUserReactions) => ({
          ...currentUserReactions,
          [question.id]: question.user_reaction as string,
        }));
      }

      if (question.course_id && !courseId) {
        setCourseId(question.course_id);
      }
    },
    [courseId, reloadQuestions]
  );

  const questionCountLabel = `${questions.length} conversaciones`;

  return {
    activeSearchQuery,
    handleClearSearch,
    handleQuestionCreated,
    handleReaction,
    handleSearch,
    hasMore,
    loading,
    loadingMore,
    loadMoreQuestions,
    questionCountLabel,
    questions,
    reactionCounts,
    searchQuery,
    selectedQuestionId,
    setSearchQuery,
    setShowCreateForm,
    showCreateForm,
    toggleQuestionSelection,
    userReactions,
  };
}
