import { useTranslation } from "react-i18next";
import type { PendingCourseModule } from "../types";
import { PendingCourseLessonItem } from "./PendingCourseLessonItem";

export function PendingCourseModuleCard({ module }: { module: PendingCourseModule }) {
  const { t } = useTranslation("admin");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {t("lessonContent.moduleTitle", {
            order: module.module_order_index,
            title: module.module_title,
          })}
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {module.lessons?.map((lesson) => (
          <PendingCourseLessonItem key={lesson.lesson_id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
