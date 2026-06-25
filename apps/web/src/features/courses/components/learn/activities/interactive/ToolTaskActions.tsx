import { Clipboard, ExternalLink } from "lucide-react";

import { copyTextToClipboard } from "@/lib/clipboard";
import type { LearnActivity } from "../../types";

export function ToolTaskActions(props: {
  activity: LearnActivity;
  activityConfig: NonNullable<LearnActivity["activity_config"]>;
  message: string | null;
  setMessage: (message: string | null) => void;
}) {
  const toolTask = "toolTask" in props.activityConfig ? props.activityConfig.toolTask : null;
  const promptText = toolTask?.promptTemplate?.trim() || "";

  if (!toolTask) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-[var(--color-legacy-f1fbf8)] px-4 py-3 dark:bg-[var(--color-legacy-08201b)]" style={{ borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)' }}>
      <div className="flex flex-wrap items-center gap-2">
        {toolTask.showCopyButton && promptText && (
          <button type="button" onClick={() => copyPrompt(promptText, props.setMessage)} className="inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-white px-3 py-2 text-xs font-medium text-primary transition hover:border-primary/20 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Clipboard className="h-3.5 w-3.5" />
            Copiar prompt
          </button>
        )}
        {props.activity.external_tool?.url && toolTask.openInNewTab && (
          <button type="button" onClick={() => openExternalTool(props.activity, props.setMessage)} className="inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-white px-3 py-2 text-xs font-medium text-primary transition hover:border-primary/20 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir {props.activity.external_tool?.label || "herramienta"}
          </button>
        )}
      </div>
      {props.message && (
        <p className="mt-2 text-xs text-[var(--color-legacy-0f6a57)] dark:text-[var(--color-legacy-9de9d5)]">
          {props.message}
        </p>
      )}
    </div>
  );
}

async function copyPrompt(promptText: string, setMessage: (message: string) => void) {
  const copied = await copyTextToClipboard(promptText);
  setMessage(copied ? "Prompt copiado al portapapeles." : "No fue posible copiar el prompt.");
}

function openExternalTool(
  activity: LearnActivity,
  setMessage: (message: string) => void
) {
  window.open(activity.external_tool?.url || "", "_blank", "noopener,noreferrer");
  setMessage(
    `Abriendo ${activity.external_tool?.label || "herramienta"} en una nueva ventana.`
  );
}
