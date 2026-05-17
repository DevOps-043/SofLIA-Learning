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

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => { props.setFeedbackMessage(null); void props.onSaveDraft(); }} disabled={disabledBase} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white">
        {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar borrador
      </button>
      <button type="button" onClick={() => { props.setFeedbackMessage(null); void props.onSubmitActivity(); }} disabled={disabledBase || !props.isSubmissionStructurallyComplete} className="inline-flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d2f4d] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#00D4B3] dark:text-[#08141F] dark:hover:bg-[#00b79c]">
        {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enviar actividad
      </button>
      {props.activityConfig.validation.enabled && (
        <button type="button" onClick={() => void props.onEvaluateWithSoflia()} disabled={disabledBase || props.isLiaBusy || !props.isSubmissionStructurallyComplete || !props.canEvaluateWithSoflia} className="inline-flex items-center gap-2 rounded-lg border border-[#6E57B5]/20 bg-[#F7F4FF] px-4 py-2 text-sm font-medium text-[#4C3A85] transition hover:bg-[#EFE8FF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#7E67BA]/30 dark:bg-[#171127] dark:text-[#D7CBFF] dark:hover:bg-[#211937]">
          {props.liaEvaluationPending || props.isLiaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Evaluar con SofLIA
        </button>
      )}
    </div>
  );
}
