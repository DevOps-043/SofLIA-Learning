import { useMemo } from "react";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActivityCard } from "../activities/ActivityCard";
import { sortActivitiesByDisplayOrder } from "../activities/utils";
import styles from "../ActivitiesExperience.module.css";
import { SectionCountHeader } from "./SectionCountHeader";
import type { ActivitiesData, LearnActivity } from "./types";

export function ActivityListSection(props: {
  data: ActivitiesData;
  lessonId: string;
  onQuizSubmitted: () => void | Promise<void>;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  onStartAiChat: (
    activity: LearnActivity,
    onDone: (conversationId?: string | null) => void | Promise<void>
  ) => void;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
  slug: string;
}) {
  const { t } = useTranslation("learn");

  const orderedActivities = useMemo(
    () => sortActivitiesByDisplayOrder(props.data.activities),
    [props.data.activities],
  );

  if (orderedActivities.length === 0) {
    return null;
  }

  return (
    <section data-tour-id="course-learn--activity-list" className={styles.group}>
      <SectionCountHeader
        count={orderedActivities.length}
        icon={Activity}
        label={t("activities.title")}
      />
      <div className={styles.stack}>
        {orderedActivities.map((activity) => (
          <ActivityCard
            key={activity.activity_id}
            activity={activity}
            isCollapsed={props.data.collapsedActivities.has(activity.activity_id)}
            lessonId={props.lessonId}
            onQuizSubmitted={props.onQuizSubmitted}
            onRequestQuizFeedback={props.onRequestQuizFeedback}
            onStartAiChat={props.onStartAiChat}
            onToggle={props.data.toggleActivityCollapse}
            onTriggerLiaFeedback={props.onTriggerLiaFeedback}
            quizStatus={props.data.quizStatus}
            slug={props.slug}
          />
        ))}
      </div>
    </section>
  );
}
