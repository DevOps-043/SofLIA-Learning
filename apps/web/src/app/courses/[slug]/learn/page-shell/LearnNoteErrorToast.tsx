interface LearnNoteErrorToastProps {
  error: string | null;
  onDismiss: () => void;
}

export function LearnNoteErrorToast({
  error,
  onDismiss,
}: LearnNoteErrorToastProps) {
  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-lg">
      <span>{error}</span>
      <button
        className="ml-3 text-red-300 hover:text-red-100"
        onClick={onDismiss}
        type="button"
      >
        x
      </button>
    </div>
  );
}
