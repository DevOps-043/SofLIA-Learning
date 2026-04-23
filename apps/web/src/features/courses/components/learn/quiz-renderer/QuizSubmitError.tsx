interface QuizSubmitErrorProps {
  submitError: string | null;
}

export function QuizSubmitError({ submitError }: QuizSubmitErrorProps) {
  if (!submitError) {
    return null;
  }

  return (
    <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
      <p className="text-red-400 text-xs">{submitError}</p>
    </div>
  );
}
