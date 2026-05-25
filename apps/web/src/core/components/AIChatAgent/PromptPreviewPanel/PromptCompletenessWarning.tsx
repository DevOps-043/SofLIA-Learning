import { AlertCircle } from 'lucide-react';

interface PromptCompletenessWarningProps {
  completeness: number;
}

export function PromptCompletenessWarning({
  completeness
}: PromptCompletenessWarningProps) {
  if (completeness >= 50) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-yellow-700 dark:text-yellow-300">
        El prompt necesita al menos 50% de completitud para guardarse.
      </p>
    </div>
  );
}
