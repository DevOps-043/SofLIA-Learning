import { DocumentTextIcon } from "@heroicons/react/24/outline";
import type { PendingCourseMaterial } from "../types";
import { parseMaterialContent } from "../utils";
import { PendingCourseQuizViewer } from "./PendingCourseQuizViewer";
import type { QuizData } from "./types";

export function PendingCourseMaterialItem({ material }: { material: PendingCourseMaterial }) {
  const isInteractive = material.material_type === "quiz" || material.material_type === "interactive";

  if (!material.material_type || !isInteractive) {
    return <MaterialLink material={material} />;
  }

  const { error, parsedContent } = parseMaterialContent(material.content_data);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <MaterialTypeBadge materialType={material.material_type} />
          <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {material.material_title}
          </h5>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="rounded bg-red-50 p-2 font-mono text-xs text-red-500 dark:bg-red-900/20">{error}</div>
        ) : (
          <div className="text-sm">
            {material.material_type === "quiz" && <PendingCourseQuizViewer data={parsedContent as QuizData | null} />}
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialLink({ material }: { material: PendingCourseMaterial }) {
  return (
    <a
      className="group flex items-center gap-3 rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      href={material.file_url || material.external_url || "#"}
      rel="noreferrer"
      target="_blank"
    >
      <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
      <span className="text-sm text-gray-700 dark:text-gray-200">{material.material_title}</span>
      <span className="ml-auto text-xs uppercase text-gray-400">{material.material_type || "archivo"}</span>
    </a>
  );
}

function MaterialTypeBadge({ materialType }: { materialType: string }) {
  const className = materialType === "quiz"
    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

  return <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${className}`}>{materialType}</span>;
}
