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
    <div className="rounded-xl border border-[var(--color-legacy-e3d9ff)] bg-[var(--color-legacy-f7f4ff)] px-4 py-4 dark:border-[color-mix(in_srgb,var(--color-legacy-7e67ba)_30%,transparent)] dark:bg-[var(--color-legacy-171127)]">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--color-legacy-6e57b5)] dark:text-[var(--color-legacy-bfaeff)]" />
        <p className="text-sm font-semibold text-[var(--color-legacy-4c3a85)] dark:text-[var(--color-legacy-d7cbff)]">
          Retroalimentacion SofLIA
        </p>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-legacy-4c3a85)] dark:text-[var(--color-legacy-e7e0ff)]">
        {evaluation.summary}
      </p>
      <EvaluationList title="Fortalezas" items={evaluation.strengths} />
      <EvaluationList title="A mejorar" items={evaluation.improvements} />
      <p className="mt-3 text-sm font-medium text-[var(--color-legacy-4c3a85)] dark:text-[var(--color-legacy-e7e0ff)]">
        Siguiente paso: {evaluation.suggestedNextStep}
      </p>
    </div>
  );
}

function EvaluationList(props: { items: string[]; title: string }) {
  if (props.items.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-legacy-6e57b5)] dark:text-[var(--color-legacy-bfaeff)]">
        {props.title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-legacy-4c3a85)] dark:text-[var(--color-legacy-e7e0ff)]">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
