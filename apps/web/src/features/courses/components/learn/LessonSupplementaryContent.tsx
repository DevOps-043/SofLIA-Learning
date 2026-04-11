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
}: SupplementarySectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-gray-50/80 shadow-sm transition-colors dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/[0.05] md:px-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A2540]/10 text-[#0A2540] dark:bg-[#00D4B3]/10 dark:text-[#00D4B3]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#0A2540] dark:text-white md:text-base">
                {title}
              </span>
              <span className="rounded-full border border-[#0A2540]/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#44556B] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                {badge}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#6C757D] dark:text-white/50">
              {description}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#6C757D] transition-transform duration-200 dark:text-white/50 ${
            isOpen ? "rotate-180" : ""
          }`}
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
            className="overflow-hidden"
          >
            <div className="border-t border-[#E9ECEF] px-4 py-4 dark:border-white/10 md:px-5 md:py-5">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
      ? `${summaryContent.split(/\s+/).length} palabras`
      : t("summary.notAvailable");

  const toggleSection = (sectionId: SupplementarySectionId) => {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [sectionId]: !currentSections[sectionId],
    }));
  };

  return (
    <div className="space-y-3 border-t border-[#E9ECEF] pt-5 dark:border-[#6C757D]/30">
      <SupplementarySection
        id="lesson-transcript-panel"
        title={t("tabs.transcript")}
        description="Consulta el texto completo del video y guarda fragmentos en tus notas."
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
        title={t("tabs.summary")}
        description="Repasa los puntos clave de la lección antes de continuar."
        icon={Sparkles}
        badge={summaryBadge}
        isOpen={openSections.summary}
        onToggle={() => toggleSection("summary")}
      >
        <SummaryContent
          lesson={lesson}
          summaryContent={summaryContent}
          isLoading={isSummaryLoading}
        />
      </SupplementarySection>
    </div>
  );
}
