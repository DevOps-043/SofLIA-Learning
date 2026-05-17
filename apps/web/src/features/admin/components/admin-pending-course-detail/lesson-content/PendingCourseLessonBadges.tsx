import { useTranslation } from "react-i18next";
import type { PendingCourseLesson } from "../types";

export function PendingCourseLessonBadges({ lesson }: { lesson: PendingCourseLesson }) {
  const { t } = useTranslation("admin");

  return (
    <div className="mr-4 flex gap-2">
      {lesson.transcript_content && <Badge label="T" title={t("lessonContent.transcript")} />}
      {lesson.summary_content && <Badge label="R" title={t("lessonContent.summary")} />}
      {lesson.activities?.length ? (
        <Badge label={`A:${lesson.activities.length}`} title={t("lessonContent.activities")} />
      ) : null}
    </div>
  );
}

function Badge({ label, title }: { label: string; title: string }) {
  return (
    <span
      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700"
      title={title}
    >
      {label}
    </span>
  );
}
