"use client";

import type {
  CourseQuestion,
  CourseQuestionResponse,
  CourseQuestionUser,
  QuestionResponseReactionState,
} from "./types";

export function getQuestionUserDisplayName(user?: CourseQuestionUser | null) {
  if (!user) {
    return "Usuario";
  }

  if (user.display_name) {
    return user.display_name;
  }

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  return user.username || "Usuario";
}

export function getQuestionUserInitials(user?: CourseQuestionUser | null) {
  if (user?.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }

  if (user?.username) {
    return user.username.charAt(0).toUpperCase();
  }

  return "U";
}

export function formatQuestionTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "hace un momento";
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000) {
    return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  }

  return date.toLocaleDateString();
}

export function mergeQuestions(
  currentQuestions: CourseQuestion[],
  nextQuestions: CourseQuestion[]
) {
  const questionsById = new Map<string, CourseQuestion>();

  for (const question of currentQuestions) {
    questionsById.set(question.id, question);
  }

  for (const question of nextQuestions) {
    questionsById.set(question.id, question);
  }

  return Array.from(questionsById.values());
}

export function collectQuestionReactionMaps(questions: CourseQuestion[]) {
  const reactionCounts: Record<string, number> = {};
  const userReactions: Record<string, string> = {};

  for (const question of questions) {
    reactionCounts[question.id] = question.reaction_count || 0;
    if (question.user_reaction) {
      userReactions[question.id] = question.user_reaction;
    }
  }

  return { reactionCounts, userReactions };
}

export function collectResponseReactionState(
  responses: CourseQuestionResponse[]
): QuestionResponseReactionState {
  const counts: Record<string, number> = {};
  const reactions: Record<string, string> = {};

  const visitResponses = (items: CourseQuestionResponse[]) => {
    for (const response of items) {
      counts[response.id] = response.reaction_count || 0;
      if (response.user_reaction) {
        reactions[response.id] = response.user_reaction;
      }

      if (response.replies && response.replies.length > 0) {
        visitResponses(response.replies);
      }
    }
  };

  visitResponses(responses);

  return { counts, reactions };
}

export function appendReplyToResponseTree(
  responses: CourseQuestionResponse[],
  parentId: string,
  newReply: CourseQuestionResponse
): CourseQuestionResponse[] {
  return responses.map((response) => {
    if (response.id === parentId) {
      const replies = response.replies || [];
      if (replies.some((reply) => reply.id === newReply.id)) {
        return response;
      }

      return {
        ...response,
        replies: [...replies, newReply],
      };
    }

    if (response.replies && response.replies.length > 0) {
      return {
        ...response,
        replies: appendReplyToResponseTree(response.replies, parentId, newReply),
      };
    }

    return response;
  });
}

export function updateResponseInTree(
  responses: CourseQuestionResponse[],
  responseId: string,
  updater: (response: CourseQuestionResponse) => CourseQuestionResponse
): CourseQuestionResponse[] {
  return responses.map((response) => {
    if (response.id === responseId) {
      return updater(response);
    }

    if (response.replies && response.replies.length > 0) {
      return {
        ...response,
        replies: updateResponseInTree(response.replies, responseId, updater),
      };
    }

    return response;
  });
}

export function removeResponseFromTree(
  responses: CourseQuestionResponse[],
  responseId: string
): CourseQuestionResponse[] {
  return responses
    .filter((response) => response.id !== responseId)
    .map((response) => {
      if (response.replies && response.replies.length > 0) {
        return {
          ...response,
          replies: removeResponseFromTree(response.replies, responseId),
        };
      }

      return response;
    });
}
