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
    <div className="my-2 ml-2 hidden w-12 flex-col rounded-lg border border-[#E9ECEF] bg-white shadow-xl backdrop-blur-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329] md:flex">
      <div className="flex h-[56px] shrink-0 items-center justify-center rounded-t-lg border-b border-[#E9ECEF] bg-white p-3 backdrop-blur-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 transition-colors hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          title="Mostrar material del curso"
        >
          <ChevronRight className="h-5 w-5 text-[#6C757D] dark:text-white" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 p-2">
        <button
          onClick={onOpenContent}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          title="Ver lecciones"
        >
          <Layers className="h-4 w-4 text-[#6C757D] dark:text-white/80" />
        </button>

        <button
          onClick={onOpenNotes}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          title={t("leftPanel.notesSection.viewNotes")}
        >
          <FileText className="h-4 w-4 text-[#6C757D] dark:text-white/80" />
        </button>

        <button
          onClick={onOpenNewNote}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00D4B3] shadow-lg shadow-[#00D4B3]/25 transition-colors hover:bg-[#00b8a0]"
          title={t("leftPanel.notesSection.newNote")}
        >
          <Plus className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
