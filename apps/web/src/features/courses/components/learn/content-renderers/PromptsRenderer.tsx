"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import type { ExternalToolDefinition } from "@/features/courses/config/external-tool-registry";

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
    <div className="rounded-lg border border-[#0A2540]/15 bg-[#F5F8FC] p-4 dark:border-[#00D4B3]/20 dark:bg-[#0B1A20]">
      {externalTool && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {externalTool.url && (
            <button
              type="button"
              onClick={() => {
                window.open(externalTool.url || "", "_blank", "noopener,noreferrer");
                setActionMessage(`Abriendo ${externalTool.label} en una nueva ventana.`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#0A2540]/10 bg-white px-3 py-2 text-xs font-medium text-[#0A2540] transition hover:border-[#0A2540]/20 hover:bg-[#0A2540]/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir {externalTool.label}
            </button>
          )}
          {actionMessage && (
            <span className="text-xs text-[#0F6A57] dark:text-[#9DE9D5]">
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
            onClick={() => {
              navigator.clipboard
                .writeText(prompt)
                .then(() => {
                  setCopiedIndex(index);
                  setActionMessage("Prompt copiado al portapapeles.");
                })
                .catch(() => {
                  setActionMessage("No fue posible copiar el prompt.");
                });
            }}
            className="group w-full rounded-lg border border-[#0A2540]/15 bg-white px-4 py-3 text-left transition hover:border-[#0A2540]/30 hover:bg-[#0A2540]/5 dark:border-white/10 dark:bg-[#10161D] dark:hover:border-[#00D4B3]/30 dark:hover:bg-white/[0.03]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A2540]/10 text-xs font-bold text-[#0A2540] dark:bg-[#00D4B3]/15 dark:text-[#00D4B3]">
                {index + 1}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-[#0A2540] dark:text-white">
                {prompt}
              </p>
              <span className="mt-1 shrink-0 text-[#0A2540] dark:text-[#00D4B3]">
                <Copy className="h-4 w-4" />
              </span>
            </div>
            {copiedIndex === index && (
              <p className="mt-2 text-xs text-[#0F6A57] dark:text-[#9DE9D5]">
                Prompt copiado.
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
