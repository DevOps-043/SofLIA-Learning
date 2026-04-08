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
        <div className="rounded-xl border border-[#F3D98B] bg-[#FFF7DA] px-4 py-3 dark:border-[#8A6D1F]/50 dark:bg-[#2B2410]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A6D1F] dark:text-[#F3D98B]">
            Prompt sugerido
          </p>
          <p className="text-sm leading-relaxed text-[#5B4A18] dark:text-[#F7E7A8]">
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
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10 dark:border-white/10 dark:bg-[#10161D] dark:text-white dark:focus:border-[#00D4B3]/40 dark:focus:ring-[#00D4B3]/20"
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
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10 dark:border-white/10 dark:bg-[#10161D] dark:text-white dark:focus:border-[#00D4B3]/40 dark:focus:ring-[#00D4B3]/20"
          placeholder={
            evidencePlaceholder ||
            "Opcional: pega enlaces, prompts finales o notas de apoyo."
          }
        />
      </div>
    </div>
  );
}
