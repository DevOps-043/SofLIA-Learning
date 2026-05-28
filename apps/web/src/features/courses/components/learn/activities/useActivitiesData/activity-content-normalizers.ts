import {
  normalizeContentForRenderer,
} from '../../../../../../lib/course-content';
import { extractPromptList } from '../utils';
import type { LearnActivity } from '../../types';
import type { PromptSource } from './types';

export function buildActivityPromptSources(activities: LearnActivity[]): PromptSource[] {
  return activities
    .map((activity) => {
      const prompts = extractPromptList(activity.ai_prompts);

      if (prompts.length === 0) {
        return null;
      }

      return {
        prompts,
        content: normalizeContentForRenderer(activity.activity_content),
        title: activity.activity_title || '',
      };
    })
    .filter((source): source is PromptSource => Boolean(source));
}
