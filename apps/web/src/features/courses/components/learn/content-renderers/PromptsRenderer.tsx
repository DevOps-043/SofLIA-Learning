"use client";

import { Copy } from "lucide-react";

type PromptSource = string | unknown;

function parsePrompts(prompts: PromptSource): string[] {
  let promptsList: string[] = [];

  try {
    if (typeof prompts === "string") {
      try {
        const parsed = JSON.parse(prompts);
        if (Array.isArray(parsed)) {
          promptsList = parsed;
        } else {
          promptsList = [prompts];
        }
      } catch {
        if (prompts.trim().startsWith("[") && prompts.trim().endsWith("]")) {
          try {
            const parsed = JSON.parse(prompts);
            if (Array.isArray(parsed)) {
              promptsList = parsed;
            }
          } catch {
            promptsList = [prompts];
          }
        } else {
          promptsList = prompts.split("\n").filter((prompt) => prompt.trim());
          if (promptsList.length === 0) {
            promptsList = [prompts];
          }
        }
      }
    } else if (Array.isArray(prompts)) {
      promptsList = prompts.map((prompt) => String(prompt));
    } else {
      promptsList = [String(prompts)];
    }
  } catch {
    promptsList = [String(prompts)];
  }

  return promptsList;
}

export function PromptsRenderer({ prompts }: { prompts: PromptSource }) {
  const promptsList = parsePrompts(prompts);

  return (
    <div className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/40 rounded-lg p-4">
      <div className="space-y-2">
        {promptsList.map((prompt, index) => {
          const cleanPrompt = prompt.replace(/^["']|["']$/g, "").trim();

          return (
            <button
              key={`${index}-${cleanPrompt.slice(0, 20)}`}
              onClick={() => {
                navigator.clipboard
                  .writeText(cleanPrompt)
                  .then(() => {
                    alert("Prompt copiado al portapapeles");
                  })
                  .catch(() => undefined);
              }}
              className="w-full text-left px-4 py-3 bg-white dark:bg-[#1E2329] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/40 rounded-lg transition-all hover:border-[#00D4B3] dark:hover:border-[#00D4B3]/60 hover:shadow-lg hover:shadow-[#00D4B3]/20 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00D4B3]/20 dark:bg-[#00D4B3]/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#00D4B3]/30 dark:group-hover:bg-[#00D4B3]/50 transition-colors">
                  <span
                    className="text-[#00D4B3] text-xs font-bold"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                  >
                    {index + 1}
                  </span>
                </div>
                <p
                  className="text-[#0A2540] dark:text-white text-sm leading-relaxed flex-1 group-hover:text-[#0A2540] dark:group-hover:text-white transition-colors"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                >
                  {cleanPrompt}
                </p>
                <Copy className="w-4 h-4 text-[#00D4B3] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
