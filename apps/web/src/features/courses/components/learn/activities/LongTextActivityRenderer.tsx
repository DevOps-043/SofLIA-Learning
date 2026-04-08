"use client";

export function LongTextActivityRenderer({
  evidencePlaceholder,
  evidenceValue,
  onEvidenceChange,
  onResponseChange,
  placeholder,
  responseValue,
}: {
  evidencePlaceholder?: string;
  evidenceValue: string;
  onEvidenceChange: (value: string) => void;
  onResponseChange: (value: string) => void;
  placeholder?: string;
  responseValue: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
          Tu respuesta
        </label>
        <textarea
          value={responseValue}
          onChange={(event) => onResponseChange(event.target.value)}
          rows={8}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10 dark:border-white/10 dark:bg-[#10161D] dark:text-white dark:focus:border-[#00D4B3]/40 dark:focus:ring-[#00D4B3]/20"
          placeholder={
            placeholder ||
            "Escribe aqui lo que realizaste, tu analisis o la respuesta final."
          }
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
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10 dark:border-white/10 dark:bg-[#10161D] dark:text-white dark:focus:border-[#00D4B3]/40 dark:focus:ring-[#00D4B3]/20"
          placeholder={
            evidencePlaceholder ||
            "Pega aqui enlaces, notas, prompts usados o evidencia complementaria."
          }
        />
      </div>
    </div>
  );
}
