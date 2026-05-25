"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DialogueLoadingState() {
  const { t } = useTranslation("learn");

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-white/60" />
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{t("activities.dialogue.loadingTitle")}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-white/40">{t("activities.dialogue.loadingDescription")}</p>
      </div>
    </div>
  );
}
