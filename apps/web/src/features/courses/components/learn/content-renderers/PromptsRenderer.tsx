"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import type { ExternalToolDefinition } from "@/features/courses/config/external-tool-registry";
import { copyTextToClipboard } from "@/lib/clipboard";

type PromptSource = string | unknown;

function parsePrompts(prompts: PromptSource): string[] {
  let promptsList: string[] = [];

  try {
    if (typeof prompts === "string") {
      const trimmedPrompts = prompts.trim();
      if (!trimmedPrompts) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmedPrompts);
        if (Array.isArray(parsed)) {
          promptsList = parsed.map((prompt) => String(prompt));
        } else {
          promptsList = [trimmedPrompts];
        }
      } catch {
        promptsList = trimmedPrompts
          .split("\n")
          .map((prompt) => prompt.trim())
          .filter(Boolean);
      }
    } else if (Array.isArray(prompts)) {
      promptsList = prompts.map((prompt) => String(prompt));
    } else if (prompts !== null && prompts !== undefined) {
      promptsList = [String(prompts)];
    }
  } catch {
    promptsList = [];
  }

  return promptsList
    .map((prompt) => prompt.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

export function PromptsRenderer({
  externalTool,
  prompts,
}: {
  externalTool?: ExternalToolDefinition | null;
  prompts: PromptSource;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const promptsList = parsePrompts(prompts);

  if (promptsList.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/15 bg-[var(--color-legacy-f5f8fc)] p-4 dark:border-accent/20 dark:bg-[var(--color-legacy-0b1a20)]">
      {externalTool && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {externalTool.url && (
            <button
              type="button"
              onClick={() => {
                window.open(externalTool.url || "", "_blank", "noopener,noreferrer");
                setActionMessage(`Abriendo ${externalTool.label} en una nueva ventana.`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-white px-3 py-2 text-xs font-medium text-primary transition hover:border-primary/20 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir {externalTool.label}
            </button>
          )}
          {actionMessage && (
            <span className="text-xs text-[var(--color-legacy-0f6a57)] dark:text-[var(--color-legacy-9de9d5)]">
              {actionMessage}
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {promptsList.map((prompt, index) => (
          <button
            key={`${index}-${prompt.slice(0, 20)}`}
            type="button"
            onClick={async () => {
              const copied = await copyTextToClipboard(prompt);
              if (copied) {
                setCopiedIndex(index);
                setActionMessage("Prompt copiado al portapapeles.");
                return;
              }

              setActionMessage("No fue posible copiar el prompt.");
            }}
            className="group w-full rounded-lg border border-primary/15 bg-white px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5 dark:border-white/10 dark:bg-[var(--color-legacy-10161d)] dark:hover:border-accent/30 dark:hover:bg-white/[0.03]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-accent/15 dark:text-accent">
                {index + 1}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-primary dark:text-white">
                {prompt}
              </p>
              <span className="mt-1 shrink-0 text-primary dark:text-accent">
                <Copy className="h-4 w-4" />
              </span>
            </div>
            {copiedIndex === index && (
              <p className="mt-2 text-xs text-[var(--color-legacy-0f6a57)] dark:text-[var(--color-legacy-9de9d5)]">
                Prompt copiado.
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
