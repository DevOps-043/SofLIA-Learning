import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActivitiesContentShell } from "./ActivitiesContentShell";

export function ActivitiesLoadingState(props: { lessonTitle: string }) {
  const { t } = useTranslation("learn");

  return (
    <ActivitiesContentShell isRefreshing={false} lessonTitle={props.lessonTitle}>
      <div className="rounded-2xl border border-gray-200/80 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-white/[0.025]">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)' }}
        >
          <LoaderCircle className="h-6 w-6 animate-spin" style={{ color: 'var(--learn-accent)' }} />
        </div>
        <p className="text-sm text-gray-500 dark:text-white/65">
          {t("loading.activities")}
        </p>
      </div>
    </ActivitiesContentShell>
  );
}
