import { useTranslation } from "react-i18next";
import type { ScriptData, ScriptScene } from "./types";

export function PendingCourseScriptViewer({ data }: { data: ScriptData | null }) {
  const { t } = useTranslation("admin");

  if (!data?.scenes) {
    return <p className="italic text-gray-400">{t("lessonContent.invalidScript")}</p>;
  }

  return (
    <div className="space-y-4">
      {data.introduction && (
        <div className="mb-4 rounded bg-blue-50 p-3 text-sm italic text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          "{data.introduction}"
        </div>
      )}

      <div className="space-y-3">
        {data.scenes.map((scene, index) => (
          <ScriptSceneBubble key={index} scene={scene} />
        ))}
      </div>

      {data.conclusion && (
        <div className="mt-4 rounded border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-900 dark:bg-green-900/20 dark:text-green-100">
          <span className="font-bold">{t("lessonContent.conclusion")}:</span> {data.conclusion}
        </div>
      )}
    </div>
  );
}

function ScriptSceneBubble({ scene }: { scene: ScriptScene }) {
  const isUser = scene.character === "Usuario";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${scene.character === "Lia" ? "bg-purple-500" : "bg-gray-500"}`}>
        {scene.character?.[0] || "?"}
      </div>
      <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${isUser ? "rounded-tr-none bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" : "rounded-tl-none bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-bold opacity-70">{scene.character}</span>
          {scene.emotion && (
            <span className="rounded border border-current px-1 text-[10px] uppercase opacity-50">
              {scene.emotion}
            </span>
          )}
        </div>
        <p>{scene.message}</p>
      </div>
    </div>
  );
}
