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
        <div className={`rounded-xl border px-4 py-3 text-sm ${props.error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "border-[#B6E5DB] bg-[#F1FBF8] text-[#0F6A57] dark:border-[#00D4B3]/20 dark:bg-[#08201B] dark:text-[#9DE9D5]"}`}>
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
