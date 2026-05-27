import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActivityCard } from "../activities/ActivityCard";
import { SectionCountHeader } from "./SectionCountHeader";
import type { ActivitiesData, LearnActivity } from "./types";

export function ActivityListSection(props: {
  data: ActivitiesData;
  lessonId: string;
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

  if (props.data.activities.length === 0) {
    return null;
  }

  return (
    <div data-tour-id="course-learn--activity-list">
      <SectionCountHeader
        count={props.data.activities.length}
        icon={Activity}
        label={t("activities.title")}
      />
      <div className="space-y-2">
        {props.data.activities.map((activity) => (
          <ActivityCard
            key={activity.activity_id}
            activity={activity}
            isCollapsed={props.data.collapsedActivities.has(activity.activity_id)}
            lessonId={props.lessonId}
            onQuizSubmitted={props.data.refreshLessonContent}
            onRequestQuizFeedback={props.onRequestQuizFeedback}
            onStartAiChat={props.onStartAiChat}
            onToggle={props.data.toggleActivityCollapse}
            onTriggerLiaFeedback={props.onTriggerLiaFeedback}
            quizStatus={props.data.quizStatus}
            slug={props.slug}
          />
        ))}
      </div>
    </div>
  );
}
