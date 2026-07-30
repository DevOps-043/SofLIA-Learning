"use client";

import { Layers3, NotebookPen, PanelLeftOpen, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./CourseSidebar.module.css";

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
    <div className={styles.collapsedRail}>
      <button
        type="button"
        onClick={onOpenSidebar}
        className={styles.railButton}
        title="Mostrar material del curso"
      >
        <PanelLeftOpen aria-hidden="true" />
      </button>

      <span className={styles.railDivider} aria-hidden="true" />

      <button
        type="button"
        onClick={onOpenContent}
        className={styles.railButton}
        title="Ver lecciones"
      >
        <Layers3 aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onOpenNotes}
        className={styles.railButton}
        title={t("leftPanel.notesSection.viewNotes")}
      >
        <NotebookPen aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onOpenNewNote}
        className={styles.railPrimary}
        title={t("leftPanel.notesSection.newNote")}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}
