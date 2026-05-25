import type {
  CourseQuestion,
  CourseQuestionResponse,
  QuestionResponseReactionState,
} from "../types";

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
