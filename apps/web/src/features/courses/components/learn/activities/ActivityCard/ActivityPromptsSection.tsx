import type { TFunction } from 'i18next';
import { HelpCircle } from 'lucide-react';
import { PromptsRenderer } from '../../ContentRenderers';
import type { LearnActivity } from '../../types';

interface ActivityPromptsSectionProps {
  activity: LearnActivity;
  t: TFunction<'learn'>;
}

export function ActivityPromptsSection({ activity, t }: ActivityPromptsSectionProps) {
  if (
    activity.activity_type === 'ai_chat' ||
    !activity.ai_prompts ||
    hasToolTask(activity.activity_config)
  ) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-white/5">
      <div className="mb-3 flex items-center gap-2">
        <HelpCircle className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
        <span className="text-xs font-medium text-gray-500 dark:text-white/50">
          {t('activities.promptsAndExercises')}
        </span>
      </div>
      <PromptsRenderer
        externalTool={activity.external_tool}
        prompts={activity.ai_prompts}
      />
    </div>
  );
}

function hasToolTask(config: LearnActivity['activity_config']): boolean {
  return Boolean(config && 'toolTask' in config && config.toolTask);
}
