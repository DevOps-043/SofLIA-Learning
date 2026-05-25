import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
import type { PendingCourseLesson } from "../types";
import { PendingCourseLessonBadges } from "./PendingCourseLessonBadges";
import { PendingCourseLessonDetails } from "./PendingCourseLessonDetails";

export function PendingCourseLessonItem({ lesson }: { lesson: PendingCourseLesson }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation("admin");

  return (
    <div className="border-b border-gray-100 last:border-0 dark:border-gray-800">
      <button
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setIsExpanded((current) => !current)}
        type="button"
      >
        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
          <PlayCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{lesson.lesson_title}</h4>
          <p className="text-xs text-gray-500">
            {t("lessonContent.durationProvider", {
              duration: lesson.duration_seconds,
              provider: lesson.video_provider,
            })}
          </p>
        </div>
        <PendingCourseLessonBadges lesson={lesson} />
        <ChevronLeftIcon className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "-rotate-90" : "rotate-180"}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
          <PendingCourseLessonDetails lesson={lesson} />
        </div>
      )}
    </div>
  );
}
