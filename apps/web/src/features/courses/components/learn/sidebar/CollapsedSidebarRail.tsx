"use client";

import { ChevronRight, FileText, Layers, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

type CollapsedSidebarRailProps = {
  onOpenSidebar: () => void;
  onOpenContent: () => void;
  onOpenNotes: () => void;
  onOpenNewNote: () => void;
};

export function CollapsedSidebarRail({
  onOpenSidebar,
  onOpenContent,
  onOpenNotes,
  onOpenNewNote,
}: CollapsedSidebarRailProps) {
  const { t } = useTranslation("learn");

  return (
    <div className="my-2 ml-2 hidden w-12 flex-col rounded-lg border border-gray-200 bg-white shadow-xl backdrop-blur-sm dark:border-gray-500/30 dark:bg-carbon-800 md:flex">
      <div className="flex h-[56px] shrink-0 items-center justify-center rounded-t-lg border-b border-gray-200 bg-white p-3 backdrop-blur-sm dark:border-gray-500/30 dark:bg-carbon-800">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 transition-colors hover:bg-gray-200/50 dark:hover:bg-primary/30"
          title="Mostrar material del curso"
        >
          <ChevronRight className="h-5 w-5 text-gray-500 dark:text-white" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 p-2">
        <button
          onClick={onOpenContent}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-200/50 dark:hover:bg-primary/30"
          title="Ver lecciones"
        >
          <Layers className="h-4 w-4 text-gray-500 dark:text-white/80" />
        </button>

        <button
          onClick={onOpenNotes}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-200/50 dark:hover:bg-primary/30"
          title={t("leftPanel.notesSection.viewNotes")}
        >
          <FileText className="h-4 w-4 text-gray-500 dark:text-white/80" />
        </button>

        <button
          onClick={onOpenNewNote}
          className="flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-colors hover:brightness-95"
          style={{ backgroundColor: 'var(--learn-action)' }}
          title={t("leftPanel.notesSection.newNote")}
        >
          <Plus className="h-4 w-4" style={{ color: 'var(--learn-on-action)' }} />
        </button>
      </div>
    </div>
  );
}
