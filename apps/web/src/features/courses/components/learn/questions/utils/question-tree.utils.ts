import type {
  CourseQuestion,
  CourseQuestionResponse,
} from "../types";

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

export function appendReplyToResponseTree(
  responses: CourseQuestionResponse[],
  parentId: string,
  newReply: CourseQuestionResponse
): CourseQuestionResponse[] {
  return responses.map((response) => {
    if (response.id === parentId) {
      const replies = response.replies || [];
      if (replies.some((reply) => reply.id === newReply.id)) return response;
      return { ...response, replies: [...replies, newReply] };
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
    if (response.id === responseId) return updater(response);
    if (!response.replies || response.replies.length === 0) return response;

    return {
      ...response,
      replies: updateResponseInTree(response.replies, responseId, updater),
    };
  });
}

export function removeResponseFromTree(
  responses: CourseQuestionResponse[],
  responseId: string
): CourseQuestionResponse[] {
  return responses
    .filter((response) => response.id !== responseId)
    .map((response) => {
      if (!response.replies || response.replies.length === 0) return response;
      return {
        ...response,
        replies: removeResponseFromTree(response.replies, responseId),
      };
    });
}
