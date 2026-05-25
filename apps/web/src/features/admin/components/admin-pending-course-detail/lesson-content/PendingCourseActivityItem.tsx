import { useTranslation } from "react-i18next";
import type { PendingCourseActivity } from "../types";
import { parseMaterialContent } from "../utils";
import { PendingCourseQuizViewer } from "./PendingCourseQuizViewer";
import { PendingCourseScriptViewer } from "./PendingCourseScriptViewer";
import type { QuizData, ScriptData } from "./types";

export function PendingCourseActivityItem({ activity }: { activity: PendingCourseActivity }) {
  const { t } = useTranslation("admin");
  const { error, parsedContent } = parseMaterialContent(activity.activity_content);
  const isDialogue = activity.activity_type === "ai_chat" || activity.activity_type === "lia_script";

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <ActivityTypeBadge activityType={activity.activity_type} />
          <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {activity.activity_title}
          </h5>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="rounded bg-red-50 p-2 font-mono text-xs text-red-500 dark:bg-red-900/20">
            {error}. {t("lessonContent.raw")}: {String(activity.activity_content).substring(0, 100)}...
          </div>
        ) : (
          <div className="text-sm">
            {activity.activity_type === "quiz" && <PendingCourseQuizViewer data={parsedContent as QuizData | null} />}
            {isDialogue && <PendingCourseScriptViewer data={parsedContent as ScriptData | null} />}
            {activity.activity_type !== "quiz" && !isDialogue && (
              <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-900">
                {JSON.stringify(parsedContent, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityTypeBadge({ activityType }: { activityType?: string | null }) {
  const className = activityType === "quiz"
    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    : activityType === "ai_chat" || activityType === "lia_script"
      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

  return <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${className}`}>{activityType}</span>;
}
