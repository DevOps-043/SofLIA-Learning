"use client";

import { useMemo, useState } from "react";
import { Clock, Info, Save, ScrollText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

import { createLessonMarkdownComponents } from "@/features/courses/components/learn/markdownComponents";
import {
  alignTranscriptSegmentTimes,
  parseTranscriptSegments,
} from "@/features/courses/components/learn/transcript-segments";
import type { LearnLesson } from "@/features/courses/components/learn/types";
import { normalizeNoteContentHtml } from "@/lib/notes/generated-note-html";

const transcriptMarkdownComponents = createLessonMarkdownComponents();

function resolveVideoDurationSeconds(lesson: LearnLesson | null): number {
  if (!lesson) return 0;
  if (typeof lesson.duration_seconds === "number" && lesson.duration_seconds > 0) {
    return lesson.duration_seconds;
  }
  if (typeof lesson.total_duration_minutes === "number" && lesson.total_duration_minutes > 0) {
    return Math.round(lesson.total_duration_minutes * 60);
  }
  return 0;
}

type TranscriptContentProps = {
  isLoading: boolean;
  lesson: LearnLesson | null;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  onStatsUpdate: (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => Promise<void>;
  slug: string;
  transcriptContent: string | null;
};

export function TranscriptContent({
  isLoading,
  lesson,
  onNoteCreated,
  onStatsUpdate,
  slug,
  transcriptContent,
}: TranscriptContentProps) {
  const { t } = useTranslation("learn");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasTranscript = Boolean(
    transcriptContent && transcriptContent.trim().length > 0
  );
  const estimatedReadingTime = transcriptContent
    ? Math.ceil(transcriptContent.split(/\s+/).length / 200)
    : 0;

  // Segmentos con marcas de tiempo realineadas a la duracion real del video
  // (las transcripciones auto-generadas suelen traer marcas que no corresponden).
  const transcriptSegments = useMemo(() => {
    const segments = parseTranscriptSegments(transcriptContent || "");
    return alignTranscriptSegmentTimes(segments, resolveVideoDurationSeconds(lesson));
  }, [transcriptContent, lesson]);

  const handleSaveToNotes = async () => {
    if (!transcriptContent || !lesson) {
      return;
    }

    setIsSaving(true);

    try {
      const notePayload = {
        note_title: `${t("transcript.noteTitle")}: ${lesson.lesson_title}`,
        note_content: normalizeNoteContentHtml(transcriptContent),
        note_tags: [t("transcript.noteTags.transcript"), t("transcript.noteTags.automatic")],
        source_type: "manual",
      };

      const response = await fetch(
        `/api/courses/${slug}/lessons/${lesson.lesson_id}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(notePayload),
        }
      );

      if (!response.ok) {
        let errorData: { error?: string; message?: string } = {};

        try {
          const responseText = await response.text();
          errorData = responseText
            ? (JSON.parse(responseText) as { error?: string; message?: string })
            : { error: t("transcript.emptyServerResponse") };
        } catch {
          errorData = { error: t("transcript.serverResponseError") };
        }

        setSaveError(errorData.error || t("transcript.saveNoteError"));
        return;
      }

      const newNote = (await response.json()) as unknown;

      if (lesson.lesson_id) {
        onNoteCreated(newNote, lesson.lesson_id);
        await onStatsUpdate("create", lesson.lesson_id);
      }

      setSaveError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("transcript.saveNoteError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!lesson) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)' }}>
            <ScrollText className="h-4 w-4 animate-pulse" style={{ color: 'var(--learn-accent)' }} />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-white/60">
          {t("loading.transcript")}
        </p>
      </div>
    );
  }

  if (!hasTranscript) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)' }}>
            <Info className="h-4 w-4" style={{ color: 'var(--learn-accent)' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary dark:text-white">
              {t("transcript.notAvailable")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
              {t("transcript.notAvailableMessage")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--learn-accent)' }} />
          <span className="font-medium">{transcriptContent?.length || 0}</span>
          <span className="text-xs">{t("transcript.characters")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 font-sans">
          <Clock className="h-3.5 w-3.5" style={{ color: 'var(--learn-accent)' }} />
          <span className="font-medium">{estimatedReadingTime}</span>
          <span className="text-xs">{t("transcript.readTime")}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.03] dark:shadow-none">
        <div className="p-6">
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {transcriptSegments.map((block, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-6 py-5 first:pt-0 last:pb-0">
                {/* Time column */}
                <div className="sm:w-28 shrink-0">
                  {block.time && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--learn-accent) 8%, transparent)', color: 'var(--learn-accent)' }}>
                      <Clock className="h-3.5 w-3.5 opacity-70" />
                      <span>{block.time}</span>
                    </div>
                  )}
                </div>
                
                {/* Content column */}
                <div className="flex-1 min-w-0 prose prose-slate max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-white/80">
                  <ReactMarkdown components={transcriptMarkdownComponents}>
                    {block.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-white/30">
            {t("transcript.tips.autoGenerated")}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToNotes}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)', color: 'var(--learn-accent)' }}
            >
              <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? t("transcript.savingToNotes") : t("transcript.generateNote")}
            </button>
          </div>
          {saveError && (
            <p className="mt-2 text-xs text-red-500">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="mt-2 text-xs text-green-500">{t("transcript.savedToNotes")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
