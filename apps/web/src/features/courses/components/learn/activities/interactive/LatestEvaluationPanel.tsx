import { Sparkles } from "lucide-react";

type LatestEvaluation = {
  improvements: string[];
  strengths: string[];
  suggestedNextStep: string;
  summary: string;
};

export function LatestEvaluationPanel(props: {
  evaluation?: LatestEvaluation | null;
}) {
  const evaluation = props.evaluation;
  if (!evaluation) return null;

  return (
    <div className="rounded-xl border border-[#E3D9FF] bg-[#F7F4FF] px-4 py-4 dark:border-[#7E67BA]/30 dark:bg-[#171127]">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#6E57B5] dark:text-[#BFAEFF]" />
        <p className="text-sm font-semibold text-[#4C3A85] dark:text-[#D7CBFF]">
          Retroalimentacion SofLIA
        </p>
      </div>
      <p className="text-sm leading-relaxed text-[#4C3A85] dark:text-[#E7E0FF]">
        {evaluation.summary}
      </p>
      <EvaluationList title="Fortalezas" items={evaluation.strengths} />
      <EvaluationList title="A mejorar" items={evaluation.improvements} />
      <p className="mt-3 text-sm font-medium text-[#4C3A85] dark:text-[#E7E0FF]">
        Siguiente paso: {evaluation.suggestedNextStep}
      </p>
    </div>
  );
}

function EvaluationList(props: { items: string[]; title: string }) {
  if (props.items.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6E57B5] dark:text-[#BFAEFF]">
        {props.title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[#4C3A85] dark:text-[#E7E0FF]">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
