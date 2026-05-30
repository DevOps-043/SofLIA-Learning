import type { CourseQuestion, CourseQuestionResponse, QuestionReactionResult } from '../types';
import { normalizeResponses } from './question-thread-state';
import type { QuestionThreadSnapshot } from './types';

export async function fetchQuestionThread(
  slug: string,
  questionId: string,
  signal?: AbortSignal
): Promise<QuestionThreadSnapshot> {
  try {
    const response = await fetch(
      `/api/courses/${slug}/questions/${questionId}?include=responses`,
      { signal }
    );

    if (!response.ok) {
      return { question: null, responses: [] };
    }

    const data = await response.json();
    return {
      question: data.question || null,
      responses: data.responses ? normalizeResponses(data.responses) : [],
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return { question: null, responses: [] };
  }
}

export async function fetchQuestionResponses(slug: string, questionId: string): Promise<CourseQuestionResponse[]> {
  const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`);
  return response.ok ? normalizeResponses(await response.json()) : [];
}

export async function createQuestionResponse({
  content,
  parentId,
  questionId,
  slug,
}: {
  content: string;
  parentId?: string;
  questionId: string;
  slug: string;
}): Promise<CourseQuestionResponse | null> {
  const response = await fetch(`/api/courses/${slug}/questions/${questionId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parent_response_id: parentId }),
  });

  return response.ok ? ((await response.json()) as CourseQuestionResponse) : null;
}

export async function toggleQuestionResponseReaction(
  slug: string,
  questionId: string,
  responseId: string
): Promise<QuestionReactionResult> {
  const response = await fetch(
    `/api/courses/${slug}/questions/${questionId}/responses/${responseId}/reactions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction_type: 'like', action: 'toggle' }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to toggle response reaction');
  }

  return response.json() as Promise<QuestionReactionResult>;
}
