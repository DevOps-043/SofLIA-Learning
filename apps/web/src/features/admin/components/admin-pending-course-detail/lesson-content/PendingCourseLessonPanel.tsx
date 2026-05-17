import { useTranslation } from "react-i18next";
import type { PendingCourseLesson } from "../types";
import { PendingCourseActivityItem } from "./PendingCourseActivityItem";
import { PendingCourseMaterialItem } from "./PendingCourseMaterialItem";
import type { LessonTab } from "./types";

interface PendingCourseLessonPanelProps {
  activeTab: LessonTab;
  lesson: PendingCourseLesson;
}

export function PendingCourseLessonPanel({
  activeTab,
  lesson,
}: PendingCourseLessonPanelProps) {
  return (
    <div className="min-h-[150px] rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {activeTab === "summary" && <SummaryPanel lesson={lesson} />}
      {activeTab === "transcript" && <TranscriptPanel lesson={lesson} />}
      {activeTab === "activities" && <ActivitiesPanel lesson={lesson} />}
      {activeTab === "materials" && <MaterialsPanel lesson={lesson} />}
    </div>
  );
}

function SummaryPanel({ lesson }: { lesson: PendingCourseLesson }) {
  const { t } = useTranslation("admin");

  return (
    <div className="prose max-w-none text-sm dark:prose-invert">
      {lesson.summary_content ? lesson.summary_content : <p className="italic text-gray-400">{t("lessonContent.noSummary")}</p>}
    </div>
  );
}

function TranscriptPanel({ lesson }: { lesson: PendingCourseLesson }) {
  const { t } = useTranslation("admin");

  return (
    <div className="h-64 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
      {lesson.transcript_content || t("lessonContent.noTranscript")}
    </div>
  );
}

function ActivitiesPanel({ lesson }: { lesson: PendingCourseLesson }) {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-4">
      {lesson.activities?.length ? (
        lesson.activities.map((activity) => <PendingCourseActivityItem activity={activity} key={activity.activity_id} />)
      ) : (
        <p className="italic text-gray-400">{t("lessonContent.noActivities")}</p>
      )}
    </div>
  );
}

function MaterialsPanel({ lesson }: { lesson: PendingCourseLesson }) {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-2">
      {lesson.materials?.length ? (
        lesson.materials.map((material) => <PendingCourseMaterialItem key={material.material_id} material={material} />)
      ) : (
        <p className="italic text-gray-400">{t("lessonContent.noMaterials")}</p>
      )}
    </div>
  );
}
