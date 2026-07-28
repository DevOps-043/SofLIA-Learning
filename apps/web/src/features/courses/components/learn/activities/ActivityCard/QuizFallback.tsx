interface QuizFallbackProps {
  message: string;
  rawContent: unknown;
  tone?: 'danger' | 'warning';
}

export function QuizFallback({
  message,
  rawContent,
  tone = 'warning'
}: QuizFallbackProps) {
  const colorClasses =
    tone === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : 'text-amber-700 dark:text-amber-300';

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <p className={`${colorClasses} mb-2`}>{message}</p>
      <div
        className="whitespace-pre-wrap text-primary dark:text-white"
        style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
      >
        {typeof rawContent === 'string'
          ? rawContent
          : JSON.stringify(rawContent, null, 2)}
      </div>
    </div>
  );
}
