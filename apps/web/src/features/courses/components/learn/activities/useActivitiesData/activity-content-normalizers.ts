import {
  normalizeContentForRenderer,
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from '../../../../../../lib/course-content';
import { extractPromptList } from '../utils';
import type { LearnActivity, LearnMaterial } from '../../types';
import type { PromptSource } from './types';

export function toActivityArray(payload: unknown): LearnActivity[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((activity) => normalizeLessonActivityRecord(activity as LearnActivity));
}

export function toMaterialArray(payload: unknown): LearnMaterial[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((material) => normalizeLessonMaterialRecord(material as LearnMaterial));
}

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
