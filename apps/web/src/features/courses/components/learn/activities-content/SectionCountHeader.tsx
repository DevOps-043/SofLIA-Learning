import type { LucideIcon } from "lucide-react";

import styles from "../ActivitiesExperience.module.css";

export function SectionCountHeader(props: {
  count: number;
  icon: LucideIcon;
  label: string;
}) {
  const Icon = props.icon;

  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIcon}>
        <Icon />
      </div>
      <span className={styles.sectionLabel}>
        {props.label}
      </span>
      <span className={styles.sectionCount}>
        {props.count}
      </span>
    </div>
  );
}
