import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActivitiesContentShell } from "./ActivitiesContentShell";

export function ActivitiesEmptyState(props: { lessonTitle: string }) {
  const { t } = useTranslation("learn");

  return (
    <ActivitiesContentShell isRefreshing={false} lessonTitle={props.lessonTitle}>
      <div className="rounded-2xl border border-gray-200/80 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-white/[0.025]">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)' }}
        >
          <Activity className="h-6 w-6" style={{ color: 'var(--learn-accent)' }} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-primary dark:text-white">
          {t("activities.notAvailable")}
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-white/65">
          {t("activities.notAvailableMessage")}
        </p>
        <div className="text-sm text-gray-500 dark:text-white/60">
          <p>- {t("activities.tips.manual")}</p>
          <p>- {t("activities.tips.contactInstructor")}</p>
        </div>
      </div>
    </ActivitiesContentShell>
  );
}
