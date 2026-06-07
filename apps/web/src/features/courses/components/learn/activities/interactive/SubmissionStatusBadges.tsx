import { Check } from "lucide-react";

import type { LearnActivity } from "../../types";

export function SubmissionStatusBadges(props: {
  activity: LearnActivity;
  activityConfig: NonNullable<LearnActivity["activity_config"]>;
}) {
  const summary = props.activity.latest_submission_summary;
  const validation = "validation" in props.activityConfig ? props.activityConfig.validation : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {summary && <SubmissionStatusBadge activity={props.activity} />}
      {validation?.enabled && (
        <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-medium text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
          SofLIA disponible
        </span>
      )}
      {validation?.requiredForCompletion && (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Validacion obligatoria
        </span>
      )}
    </div>
  );
}

function SubmissionStatusBadge({ activity }: { activity: LearnActivity }) {
  const summary = activity.latest_submission_summary;
  if (!summary) return null;

  const statusLabelMap: Record<string, string> = {
    draft: "Borrador",
    needs_revision: "Revisar",
    submitted: "Enviado",
    validated: "Validado",
  };
  const toneClassMap: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
    needs_revision: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    submitted: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    validated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClassMap[summary.status] || toneClassMap.draft}`}>
      {summary.completionSatisfied && <Check className="h-3.5 w-3.5" />}
      {statusLabelMap[summary.status] || summary.status}
    </span>
  );
}
