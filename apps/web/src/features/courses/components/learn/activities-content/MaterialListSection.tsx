import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MaterialCard } from "../activities/MaterialCard";
import { SectionCountHeader } from "./SectionCountHeader";
import type { ActivitiesData } from "./types";

export function MaterialListSection(props: {
  data: ActivitiesData;
  lessonId: string;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
  slug: string;
}) {
  const { t } = useTranslation("learn");

  if (props.data.materials.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionCountHeader
        count={props.data.materials.length}
        icon={BookOpen}
        label={t("activities.materials")}
      />
      <div className="space-y-2">
        {props.data.materials.map((material) => (
          <MaterialCard
            key={material.material_id}
            isCollapsed={props.data.collapsedMaterials.has(material.material_id)}
            lessonId={props.lessonId}
            material={material}
            onQuizSubmitted={props.data.refreshLessonContent}
            onToggle={props.data.toggleMaterialCollapse}
            onTriggerLiaFeedback={props.onTriggerLiaFeedback}
            quizStatus={props.data.quizStatus}
            slug={props.slug}
          />
        ))}
      </div>
    </div>
  );
}
