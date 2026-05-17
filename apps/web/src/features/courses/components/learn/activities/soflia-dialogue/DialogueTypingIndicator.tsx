"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DialogueTypingIndicator() {
  const { t } = useTranslation("learn");

  return (
    <div className="flex justify-start gap-2">
      <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-accent/30 bg-accent/10">
        <img src="/lia-avatar.webp" alt="SofLIA" className="h-full w-full object-cover" />
      </div>
      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-white/10 dark:text-white/70">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("activities.dialogue.responding")}
      </div>
    </div>
  );
}
