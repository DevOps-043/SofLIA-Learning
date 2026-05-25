import { PromptDifficultySection } from './PromptDifficultySection';
import { PromptEditableFields } from './PromptEditableFields';
import { PromptListSection } from './PromptListSection';
import { PromptTagsSection } from './PromptTagsSection';
import type { PromptDraftEditorProps } from './types';

export function PromptPreviewContent(props: PromptDraftEditorProps) {
  const { draft } = props;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <PromptEditableFields {...props} />
      <PromptTagsSection tags={draft.tags} />
      {draft.difficulty_level && (
        <PromptDifficultySection difficulty={draft.difficulty_level} />
      )}
      <PromptListSection title="Casos de Uso" items={draft.use_cases} />
      <PromptListSection title="Consejos" items={draft.tips} icon="tips" />
    </div>
  );
}
