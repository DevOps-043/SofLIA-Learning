import { Loader2, Sparkles } from "lucide-react";

import type { LearnActivity } from "../../types";

export function ActivityActionButtons(props: {
  activityConfig: NonNullable<LearnActivity["activity_config"]>;
  canEvaluateWithSoflia: boolean;
  isLiaBusy: boolean;
  isSubmissionStructurallyComplete: boolean;
  liaEvaluationPending: boolean;
  loading: boolean;
  onEvaluateWithSoflia: () => void | Promise<void>;
  onSaveDraft: () => void | Promise<void>;
  onSubmitActivity: () => void | Promise<void>;
  saving: boolean;
  setFeedbackMessage: (message: string | null) => void;
}) {
  const disabledBase = props.loading || props.saving || props.liaEvaluationPending;
  const canShowLiaEvaluation =
    "validation" in props.activityConfig && props.activityConfig.validation.enabled;

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => { props.setFeedbackMessage(null); void props.onSaveDraft(); }} disabled={disabledBase} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white">
        {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar borrador
      </button>
      <button type="button" onClick={() => { props.setFeedbackMessage(null); void props.onSubmitActivity(); }} disabled={disabledBase || !props.isSubmissionStructurallyComplete} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-[var(--color-legacy-08141f)] dark:hover:bg-[var(--color-legacy-00b79c)]">
        {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enviar actividad
      </button>
      {canShowLiaEvaluation && (
        <button type="button" onClick={() => void props.onEvaluateWithSoflia()} disabled={disabledBase || props.isLiaBusy || !props.isSubmissionStructurallyComplete || !props.canEvaluateWithSoflia} className="inline-flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--color-legacy-6e57b5)_20%,transparent)] bg-[var(--color-legacy-f7f4ff)] px-4 py-2 text-sm font-medium text-[var(--color-legacy-4c3a85)] transition hover:bg-[var(--color-legacy-efe8ff)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[color-mix(in_srgb,var(--color-legacy-7e67ba)_30%,transparent)] dark:bg-[var(--color-legacy-171127)] dark:text-[var(--color-legacy-d7cbff)] dark:hover:bg-[var(--color-legacy-211937)]">
          {props.liaEvaluationPending || props.isLiaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Evaluar con SofLIA
        </button>
      )}
    </div>
  );
}
