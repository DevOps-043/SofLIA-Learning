interface SubmissionRequirementIssue {
  code: string;
  message: string;
}

export function ActivityMessages(props: {
  error: string | null;
  feedbackMessage: string | null;
  loading: boolean;
  submissionRequirementIssues: SubmissionRequirementIssue[];
}) {
  return (
    <>
      {(props.error || props.feedbackMessage) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${props.error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "bg-[var(--color-legacy-f1fbf8)] text-[var(--color-legacy-0f6a57)] dark:bg-[var(--color-legacy-08201b)] dark:text-[var(--color-legacy-9de9d5)]"}`}
          style={!props.error ? { borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)' } : undefined}>
          {props.error || props.feedbackMessage}
        </div>
      )}
      {!props.loading && props.submissionRequirementIssues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-medium">
            Falta completar la configuracion requerida de esta actividad.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {props.submissionRequirementIssues.map((issue) => (
              <li key={issue.code}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
