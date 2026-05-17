import { Clipboard, ExternalLink } from "lucide-react";

import { copyTextToClipboard } from "@/lib/clipboard";
import type { LearnActivity } from "../../types";

export function ToolTaskActions(props: {
  activity: LearnActivity;
  activityConfig: NonNullable<LearnActivity["activity_config"]>;
  message: string | null;
  setMessage: (message: string | null) => void;
}) {
  const promptText = props.activityConfig.toolTask?.promptTemplate?.trim() || "";

  if (!props.activityConfig.toolTask) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#B6E5DB] bg-[#F1FBF8] px-4 py-3 dark:border-[#00D4B3]/20 dark:bg-[#08201B]">
      <div className="flex flex-wrap items-center gap-2">
        {props.activityConfig.toolTask.showCopyButton && promptText && (
          <button type="button" onClick={() => copyPrompt(promptText, props.setMessage)} className="inline-flex items-center gap-2 rounded-lg border border-[#0A2540]/10 bg-white px-3 py-2 text-xs font-medium text-[#0A2540] transition hover:border-[#0A2540]/20 hover:bg-[#0A2540]/5 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Clipboard className="h-3.5 w-3.5" />
            Copiar prompt
          </button>
        )}
        {props.activity.external_tool?.url && props.activityConfig.toolTask.openInNewTab && (
          <button type="button" onClick={() => openExternalTool(props.activity, props.setMessage)} className="inline-flex items-center gap-2 rounded-lg border border-[#0A2540]/10 bg-white px-3 py-2 text-xs font-medium text-[#0A2540] transition hover:border-[#0A2540]/20 hover:bg-[#0A2540]/5 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir {props.activity.external_tool?.label || "herramienta"}
          </button>
        )}
      </div>
      {props.message && (
        <p className="mt-2 text-xs text-[#0F6A57] dark:text-[#9DE9D5]">
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
