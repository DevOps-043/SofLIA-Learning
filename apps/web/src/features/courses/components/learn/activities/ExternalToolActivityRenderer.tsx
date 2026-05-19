"use client";

export function ExternalToolActivityRenderer({
  evidencePlaceholder,
  evidenceValue,
  onEvidenceChange,
  onResponseChange,
  promptTemplate,
  responseValue,
}: {
  evidencePlaceholder?: string;
  evidenceValue: string;
  onEvidenceChange: (value: string) => void;
  onResponseChange: (value: string) => void;
  promptTemplate?: string;
  responseValue: string;
}) {
  return (
    <div className="space-y-4">
      {promptTemplate && (
        <div className="rounded-xl border border-[var(--color-legacy-f3d98b)] bg-[var(--color-legacy-fff7da)] px-4 py-3 dark:border-[color-mix(in_srgb,var(--color-legacy-8a6d1f)_50%,transparent)] dark:bg-[var(--color-legacy-2b2410)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-legacy-8a6d1f)] dark:text-[var(--color-legacy-f3d98b)]">
            Prompt sugerido
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-legacy-5b4a18)] dark:text-[var(--color-legacy-f7e7a8)]">
            {promptTemplate}
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
          Resultado final
        </label>
        <textarea
          value={responseValue}
          onChange={(event) => onResponseChange(event.target.value)}
          rows={8}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-[var(--color-legacy-10161d)] dark:text-white dark:focus:border-accent/40 dark:focus:ring-accent/20"
          placeholder="Pega aqui el resultado que obtuviste en la herramienta externa y cualquier conclusion importante."
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
          Evidencia opcional
        </label>
        <textarea
          value={evidenceValue}
          onChange={(event) => onEvidenceChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-[var(--color-legacy-10161d)] dark:text-white dark:focus:border-accent/40 dark:focus:ring-accent/20"
          placeholder={
            evidencePlaceholder ||
            "Opcional: pega enlaces, prompts finales o notas de apoyo."
          }
        />
      </div>
    </div>
  );
}
