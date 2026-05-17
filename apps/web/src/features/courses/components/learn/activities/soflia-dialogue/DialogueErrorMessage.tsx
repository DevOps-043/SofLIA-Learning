import { AlertCircle } from "lucide-react";

interface DialogueErrorMessageProps {
  error: string | null;
}

export function DialogueErrorMessage({ error }: DialogueErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}
