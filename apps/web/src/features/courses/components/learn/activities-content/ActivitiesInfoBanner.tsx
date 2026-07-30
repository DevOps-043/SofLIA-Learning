import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../ActivitiesExperience.module.css";

export function ActivitiesInfoBanner() {
  const { t } = useTranslation("learn");

  return (
    <div className={styles.infoBanner}>
      <Info aria-hidden="true" />
      <p>
        {t("activities.completionRequirement")}
      </p>
    </div>
  );
}
