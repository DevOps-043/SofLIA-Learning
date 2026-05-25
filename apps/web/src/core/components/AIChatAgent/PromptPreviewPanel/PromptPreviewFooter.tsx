import { PromptCompletenessWarning } from './PromptCompletenessWarning';
import { PromptQuickActions } from './PromptQuickActions';
import { PromptSaveButton } from './PromptSaveButton';

interface PromptPreviewFooterProps {
  copied: boolean;
  completeness: number;
  isSaving: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onEditToggle: () => void;
  onSave: () => void;
}

export function PromptPreviewFooter({
  copied,
  completeness,
  isSaving,
  onCopy,
  onDownload,
  onEditToggle,
  onSave
}: PromptPreviewFooterProps) {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-2">
      <PromptQuickActions
        copied={copied}
        onCopy={onCopy}
        onDownload={onDownload}
        onEditToggle={onEditToggle}
      />
      <PromptSaveButton
        completeness={completeness}
        isSaving={isSaving}
        onSave={onSave}
      />
      <PromptCompletenessWarning completeness={completeness} />
    </div>
  );
}
