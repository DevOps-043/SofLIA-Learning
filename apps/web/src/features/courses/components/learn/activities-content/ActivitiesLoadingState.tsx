import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ActivitiesLoadingState(props: { lessonTitle: string }) {
  const { t } = useTranslation("learn");

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2">
          {t("activities.title")}
        </h2>
        <p className="text-[#6C757D] dark:text-white/80 text-sm">
          {props.lessonTitle}
        </p>
      </div>
      <div className="bg-white dark:bg-[#1E2329] rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 text-center">
        <div className="w-16 h-16 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3] animate-pulse" />
        </div>
        <p className="text-[#6C757D] dark:text-white/80">
          {t("loading.activities")}
        </p>
      </div>
    </div>
  );
}
