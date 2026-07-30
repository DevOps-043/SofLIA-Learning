"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  type LucideIcon,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { SummaryContent } from "./SummaryContent";
import { TranscriptContent } from "./TranscriptContent";
import styles from "./LessonSupplementaryContent.module.css";
import type { LearnLesson } from "./types";

type SupplementarySectionId = "transcript" | "summary";

type LessonSupplementaryContentProps = {
  isSummaryLoading: boolean;
  isTranscriptLoading: boolean;
  lesson: LearnLesson;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  onStatsUpdate: (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => Promise<void>;
  slug: string;
  summaryContent: string | null;
  transcriptContent: string | null;
};

type SupplementarySectionProps = {
  badge: string;
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  tourId?: string;
};

function SupplementarySection({
  badge,
  children,
  description,
  icon: Icon,
  id,
  isOpen,
  onToggle,
  title,
  tourId,
}: SupplementarySectionProps) {
  return (
    <article
      data-tour-id={tourId}
      className={`${styles.resourceSection} ${
        isOpen ? styles.resourceSectionOpen : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
        className={styles.resourceButton}
      >
        <div className={styles.resourceIdentity}>
          <div className={styles.resourceIcon}>
            <Icon aria-hidden="true" />
          </div>
          <div className={styles.resourceCopy}>
            <div className={styles.resourceTitleRow}>
              <span className={styles.resourceTitle}>{title}</span>
              <span className={styles.resourceBadge}>{badge}</span>
            </div>
            <p className={styles.resourceDescription}>{description}</p>
          </div>
        </div>

        <ChevronDown
          className={`${styles.resourceChevron} ${
            isOpen ? styles.resourceChevronOpen : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key={id}
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={styles.resourceBody}
          >
            <div className={styles.resourceBodyInner}>
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

export function LessonSupplementaryContent({
  isSummaryLoading,
  isTranscriptLoading,
  lesson,
  onNoteCreated,
  onStatsUpdate,
  slug,
  summaryContent,
  transcriptContent,
}: LessonSupplementaryContentProps) {
  const { t } = useTranslation("learn");
  const [openSections, setOpenSections] = useState<
    Record<SupplementarySectionId, boolean>
  >({
    summary: false,
    transcript: false,
  });

  useEffect(() => {
    setOpenSections({
      summary: false,
      transcript: false,
    });
  }, [lesson.lesson_id]);

  const transcriptBadge = isTranscriptLoading
    ? t("loading.transcript")
    : transcriptContent?.trim()
      ? `${transcriptContent.length} ${t("transcript.characters")}`
      : t("transcript.notAvailable");

  const summaryBadge = isSummaryLoading
    ? t("loading.summary")
    : summaryContent?.trim()
      ? `${summaryContent.split(/\s+/).length} ${t("summary.words")}`
      : t("summary.notAvailable");

  const toggleSection = (sectionId: SupplementarySectionId) => {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [sectionId]: !currentSections[sectionId],
    }));
  };

  return (
    <div
      data-tour-id="course-learn--lesson-resources"
      className={styles.resources}
    >
      <SupplementarySection
        id="lesson-transcript-panel"
        tourId="course-learn--transcript-section"
        title={t("tabs.transcript")}
        description={t("transcript.sectionDescription")}
        icon={ScrollText}
        badge={transcriptBadge}
        isOpen={openSections.transcript}
        onToggle={() => toggleSection("transcript")}
      >
        <TranscriptContent
          lesson={lesson}
          slug={slug}
          transcriptContent={transcriptContent}
          isLoading={isTranscriptLoading}
          onNoteCreated={onNoteCreated}
          onStatsUpdate={onStatsUpdate}
        />
      </SupplementarySection>

      <SupplementarySection
        id="lesson-summary-panel"
        tourId="course-learn--summary-section"
        title={t("tabs.summary")}
        description={t("summary.sectionDescription")}
        icon={Sparkles}
        badge={summaryBadge}
        isOpen={openSections.summary}
        onToggle={() => toggleSection("summary")}
      >
        <SummaryContent
          lesson={lesson}
          slug={slug}
          summaryContent={summaryContent}
          isLoading={isSummaryLoading}
          onNoteCreated={onNoteCreated}
          onStatsUpdate={onStatsUpdate}
        />
      </SupplementarySection>
    </div>
  );
}
