"use client";

import { useState } from "react";
import { Clock, Info, Save, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

import { createLessonMarkdownComponents } from "@/features/courses/components/learn/markdownComponents";
import type { LearnLesson } from "@/features/courses/components/learn/types";

const summaryMarkdownComponents = createLessonMarkdownComponents({
  includeCode: true,
});

type SummaryContentProps = {
  isLoading: boolean;
  lesson: LearnLesson;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  onStatsUpdate: (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => Promise<void>;
  slug: string;
  summaryContent: string | null;
};

export function SummaryContent({
  isLoading,
  lesson,
  onNoteCreated,
  onStatsUpdate,
  slug,
  summaryContent,
}: SummaryContentProps) {
  const { t } = useTranslation("learn");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasSummary = Boolean(summaryContent && summaryContent.trim().length > 0);
  const summaryWordCount = summaryContent?.split(/\s+/).length || 0;
  const estimatedReadingTime = summaryContent
    ? Math.ceil(summaryWordCount / 200)
    : 0;

  const handleSaveToNotes = async () => {
    if (!summaryContent || !lesson.lesson_id) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note_content: summaryContent,
            note_tags: [
              t("summary.noteTags.summary"),
              t("summary.noteTags.automatic"),
            ],
            note_title: `${t("summary.noteTitle")}: ${lesson.lesson_title}`,
            source_type: "manual",
          }),
        }
      );

      if (!response.ok) {
        let errorData: { error?: string; message?: string } = {};

        try {
          const responseText = await response.text();
          errorData = responseText
            ? (JSON.parse(responseText) as { error?: string; message?: string })
            : { error: t("summary.emptyServerResponse") };
        } catch {
          errorData = { error: t("summary.serverResponseError") };
        }

        setSaveError(errorData.error || t("summary.saveNoteError"));
        return;
      }

      const newNote = (await response.json()) as unknown;

      onNoteCreated(newNote, lesson.lesson_id);
      await onStatsUpdate("create", lesson.lesson_id);

      setSaveError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : t("summary.saveNoteError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D7DEE6] bg-white p-5 dark:border-white/10 dark:bg-[#0F1419]/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A2540]/10 dark:bg-[#00D4B3]/10">
            <Sparkles className="h-4 w-4 animate-pulse text-[#0A2540] dark:text-[#00D4B3]" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-36 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
          </div>
        </div>
        <p className="mt-4 text-sm text-[#6C757D] dark:text-white/60">
          {t("loading.summary")}
        </p>
      </div>
    );
  }

  if (!hasSummary) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D7DEE6] bg-white p-5 dark:border-white/10 dark:bg-[#0F1419]/40">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A2540]/10 dark:bg-[#00D4B3]/10">
            <Info className="h-4 w-4 text-[#0A2540] dark:text-[#00D4B3]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0A2540] dark:text-white">
              {t("summary.notAvailable")}
            </h3>
            <p className="mt-1 text-sm text-[#6C757D] dark:text-white/60">
              {t("summary.notAvailableMessage")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[#0A2540]/10 bg-white px-3 py-1.5 text-sm text-[#44556B] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0A2540] dark:bg-[#00D4B3]" />
          <span className="font-medium">{summaryWordCount}</span>
          <span className="text-xs">{t("summary.words")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#0A2540]/10 bg-white px-3 py-1.5 text-sm text-[#44556B] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <Clock className="h-3.5 w-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
          <span className="font-medium">{estimatedReadingTime}</span>
          <span className="text-xs">{t("summary.readTime")}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1419]/50">
        <div className="prose prose-slate max-w-none p-6 dark:prose-invert">
          <ReactMarkdown components={summaryMarkdownComponents}>
            {summaryContent || ""}
          </ReactMarkdown>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E9ECEF] bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#6C757D] dark:text-white/30">
            {t("summary.generatedFor", { lessonTitle: lesson.lesson_title })}
          </span>
          <button
            type="button"
            onClick={handleSaveToNotes}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg border border-[#0A2540]/15 bg-[#0A2540]/8 px-4 py-1.5 text-xs font-medium text-[#0A2540] transition-colors hover:bg-[#0A2540]/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#00D4B3]/20 dark:bg-[#00D4B3]/10 dark:text-[#00D4B3] dark:hover:bg-[#00D4B3]/15"
          >
            <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? t("summary.savingToNotes") : t("summary.generateNote")}
          </button>
          {saveError && <p className="mt-2 text-xs text-red-500">{saveError}</p>}
          {saveSuccess && (
            <p className="mt-2 text-xs text-green-500">
              {t("summary.savedToNotes")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
