import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function ActivitiesContentShell(props: {
  children: ReactNode;
  isRefreshing: boolean;
  lessonTitle: string;
}) {
  const { t } = useTranslation("learn");

  return (
    <div data-tour-id="course-learn--activities-content" className="space-y-6 pb-24 md:pb-6">
      <div className="pb-4 border-b border-gray-200 dark:border-white/5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              data-tour-id="course-learn--activities-header"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {t("activities.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
              {props.lessonTitle}
            </p>
          </div>
          {props.isRefreshing && (
            <span className="text-xs font-medium text-gray-500 dark:text-white/50">
              {t("activities.updatingProgress")}
            </span>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
}
