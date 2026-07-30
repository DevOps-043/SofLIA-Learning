import { Loader2, Save, Send, Sparkles } from "lucide-react";

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
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-200/70 pt-4 dark:border-white/10">
      <button type="button" onClick={() => { props.setFeedbackMessage(null); void props.onSaveDraft(); }} disabled={disabledBase} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[color-mix(in_srgb,var(--learn-accent)_28%,transparent)] hover:text-[var(--learn-accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
        {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar borrador
      </button>
      <button type="button" onClick={() => { props.setFeedbackMessage(null); void props.onSubmitActivity(); }} disabled={disabledBase || !props.isSubmissionStructurallyComplete} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: 'var(--learn-action)', borderColor: 'color-mix(in srgb, var(--learn-action) 28%, transparent)', boxShadow: '0 0.55rem 1.25rem color-mix(in srgb, var(--learn-action) 14%, transparent)', color: 'var(--learn-on-action)' }}>
        {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar actividad
      </button>
      {canShowLiaEvaluation && (
        <button type="button" onClick={() => void props.onEvaluateWithSoflia()} disabled={disabledBase || props.isLiaBusy || !props.isSubmissionStructurallyComplete || !props.canEvaluateWithSoflia} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: 'color-mix(in srgb, var(--learn-accent) 28%, transparent)', backgroundColor: 'color-mix(in srgb, var(--learn-accent) 8%, transparent)', color: 'var(--learn-accent)' }}>
          {props.liaEvaluationPending || props.isLiaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Evaluar con SofLIA
        </button>
      )}
    </div>
  );
}
