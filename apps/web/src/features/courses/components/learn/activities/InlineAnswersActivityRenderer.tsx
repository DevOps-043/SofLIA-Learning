"use client";

import { Fragment } from "react";

import type { ActivityField } from "@/features/courses/types/activity-config";

const inlineBlankPattern = /_{5,}/g;

function buildFieldInput({
  field,
  value,
  onChange,
}: {
  field: ActivityField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.multiline) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="min-h-[88px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-[var(--color-legacy-10161d)] dark:text-white dark:focus:border-accent/40 dark:focus:ring-accent/20"
        placeholder={field.placeholder || "Escribe tu respuesta"}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="inline-flex min-w-[180px] rounded-lg border-b-2 bg-transparent px-2 py-1 text-sm text-gray-900 dark:text-white outline-none transition focus:border-[color:var(--learn-accent)]"
      style={{ borderColor: 'color-mix(in srgb, var(--learn-accent) 30%, transparent)' }}
      placeholder={field.placeholder || "Respuesta"}
    />
  );
}

export function InlineAnswersActivityRenderer({
  content,
  evidencePlaceholder,
  evidenceValue,
  fields,
  onEvidenceChange,
  onFieldChange,
  values,
}: {
  content: string;
  evidencePlaceholder?: string;
  evidenceValue: string;
  fields: ActivityField[];
  onEvidenceChange: (value: string) => void;
  onFieldChange: (fieldId: string, value: string) => void;
  values: Record<string, string>;
}) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let fieldCursor = 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[var(--color-legacy-10161d)]">
        {lines.length > 0 ? (
          lines.map((line, lineIndex) => {
            const matches = Array.from(line.matchAll(inlineBlankPattern));

            if (matches.length === 0) {
              return (
                <p
                  key={`line-${lineIndex}`}
                  className="text-sm leading-relaxed text-gray-700 dark:text-white/80"
                >
                  {line}
                </p>
              );
            }

            const parts = line.split(inlineBlankPattern);
            const renderedLine = parts.flatMap((part, partIndex) => {
              const nextField = fields[fieldCursor];
              const nodes = [
                <Fragment key={`text-${lineIndex}-${partIndex}`}>{part}</Fragment>,
              ];

              if (partIndex < matches.length && nextField) {
                const currentField = nextField;
                fieldCursor += 1;

                nodes.push(
                  <span
                    key={`field-${currentField.id}`}
                    className="mx-1 inline-flex min-w-[220px] align-middle"
                  >
                    {buildFieldInput({
                      field: currentField,
                      onChange: (value) => onFieldChange(currentField.id, value),
                      value: values[currentField.id] || "",
                    })}
                  </span>
                );
              }

              return nodes;
            });

            return (
              <label
                key={`line-${lineIndex}`}
                className="block text-sm leading-relaxed text-gray-800 dark:text-white"
              >
                {renderedLine}
              </label>
            );
          })
        ) : (
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
                  {field.label}
                </label>
                {buildFieldInput({
                  field,
                  onChange: (value) => onFieldChange(field.id, value),
                  value: values[field.id] || "",
                })}
              </div>
            ))}
          </div>
        )}
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
            "Opcional: pega notas o evidencia complementaria."
          }
        />
      </div>
    </div>
  );
}
