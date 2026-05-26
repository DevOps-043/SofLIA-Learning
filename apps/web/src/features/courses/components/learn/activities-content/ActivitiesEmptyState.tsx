import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ActivitiesEmptyState(props: { lessonTitle: string }) {
  const { t } = useTranslation("learn");

  return (
    <div data-tour-id="course-learn--activities-content" className="space-y-6 pb-24 md:pb-6">
      <div>
        <h2
          data-tour-id="course-learn--activities-header"
          className="text-2xl font-bold text-primary dark:text-white mb-2"
        >
          {t("activities.title")}
        </h2>
        <p className="text-gray-500 dark:text-white/80 text-sm">
          {props.lessonTitle}
        </p>
      </div>
      <div className="bg-white dark:bg-carbon-800 rounded-xl border-2 border-gray-200 dark:border-gray-500/30 p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 dark:bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-primary dark:text-accent" />
        </div>
        <h3 className="text-primary dark:text-white text-lg font-semibold mb-2">
          {t("activities.notAvailable")}
        </h3>
        <p className="text-gray-500 dark:text-white/80 mb-4">
          {t("activities.notAvailableMessage")}
        </p>
        <div className="text-sm text-gray-500 dark:text-white/60">
          <p>- {t("activities.tips.manual")}</p>
          <p>- {t("activities.tips.contactInstructor")}</p>
        </div>
      </div>
    </div>
  );
}
