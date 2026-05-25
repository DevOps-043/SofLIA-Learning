import type { PromptDraft } from './types';

const COMPLETENESS_WEIGHTS = {
  title: 20,
  description: 15,
  content: 35,
  tags: 10,
  difficulty_level: 5,
  use_cases: 10,
  tips: 5
} as const;

export function calculateCompleteness(draft: PromptDraft): number {
  let score = 0;

  if (draft.title.trim().length > 0) {
    score += COMPLETENESS_WEIGHTS.title;
  }
  if (draft.description.trim().length > 0) {
    score += COMPLETENESS_WEIGHTS.description;
  }
  if (draft.content.trim().length > 10) {
    score += COMPLETENESS_WEIGHTS.content;
  }
  if (draft.tags.length > 0) {
    score += COMPLETENESS_WEIGHTS.tags;
  }
  if (draft.difficulty_level) {
    score += COMPLETENESS_WEIGHTS.difficulty_level;
  }
  if (draft.use_cases.length > 0) {
    score += COMPLETENESS_WEIGHTS.use_cases;
  }
  if (draft.tips.length > 0) {
    score += COMPLETENESS_WEIGHTS.tips;
  }

  return score;
}
