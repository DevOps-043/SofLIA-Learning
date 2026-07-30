import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MaterialCard } from "../activities/MaterialCard";
import styles from "../ActivitiesExperience.module.css";
import { SectionCountHeader } from "./SectionCountHeader";
import type { ActivitiesData } from "./types";

export function MaterialListSection(props: {
  data: ActivitiesData;
  lessonId: string;
  onQuizSubmitted: () => void | Promise<void>;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  slug: string;
}) {
  const { t } = useTranslation("learn");

  if (props.data.materials.length === 0) {
    return null;
  }

  return (
    <section data-tour-id="course-learn--material-list" className={styles.group}>
      <SectionCountHeader
        count={props.data.materials.length}
        icon={BookOpen}
        label={t("activities.materials")}
      />
      <div className={styles.stack}>
        {props.data.materials.map((material) => (
          <MaterialCard
            key={material.material_id}
            isCollapsed={props.data.collapsedMaterials.has(material.material_id)}
            lessonId={props.lessonId}
            material={material}
            onQuizSubmitted={props.onQuizSubmitted}
            onRequestQuizFeedback={props.onRequestQuizFeedback}
            onToggle={props.data.toggleMaterialCollapse}
            quizStatus={props.data.quizStatus}
            slug={props.slug}
          />
        ))}
      </div>
    </section>
  );
}
