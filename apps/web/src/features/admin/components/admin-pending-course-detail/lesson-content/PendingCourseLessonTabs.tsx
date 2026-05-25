import { useTranslation } from "react-i18next";
import type { PendingCourseLesson } from "../types";
import type { LessonTab } from "./types";

interface PendingCourseLessonTabsProps {
  activeTab: LessonTab;
  lesson: PendingCourseLesson;
  setActiveTab: (tab: LessonTab) => void;
}

export function PendingCourseLessonTabs({
  activeTab,
  lesson,
  setActiveTab,
}: PendingCourseLessonTabsProps) {
  const { t } = useTranslation("admin");
  const tabs: Array<{ id: LessonTab; label: string }> = [
    { id: "summary", label: t("lessonContent.summary") },
    { id: "transcript", label: t("lessonContent.transcript") },
    { id: "activities", label: t("lessonContent.activitiesWithCount", { count: lesson.activities?.length || 0 }) },
    { id: "materials", label: t("lessonContent.materialsWithCount", { count: lesson.materials?.length || 0 }) },
  ];

  return (
    <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
