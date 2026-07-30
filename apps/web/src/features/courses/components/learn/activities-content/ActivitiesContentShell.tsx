import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../ActivitiesExperience.module.css";

export function ActivitiesContentShell(props: {
  children: ReactNode;
  isRefreshing: boolean;
  lessonTitle: string;
}) {
  const { t } = useTranslation("learn");

  return (
    <div data-tour-id="course-learn--activities-content" className={styles.shell}>
      {props.isRefreshing && (
        <span className={styles.refreshing} role="status">
          <LoaderCircle aria-hidden="true" />
          {t("activities.updatingProgress")}
        </span>
      )}
      {props.children}
    </div>
  );
}
