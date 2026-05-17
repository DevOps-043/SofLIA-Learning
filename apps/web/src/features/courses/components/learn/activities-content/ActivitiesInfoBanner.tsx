import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ActivitiesInfoBanner() {
  const { t } = useTranslation("learn");

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
      <Info className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0" />
      <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
        {t("activities.completionRequirement")}
      </p>
    </div>
  );
}
