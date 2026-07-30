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
import styles from "./LessonSupplementaryContent.module.css";

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
    <div className={styles.contentStack}>
      <div className={styles.metaBar}>
        <div className={styles.metaPill}>
          <span className={styles.metaDot} aria-hidden="true" />
          <strong>{transcriptContent?.length || 0}</strong>
          <span>{t("transcript.characters")}</span>
        </div>
        <div className={styles.metaPill}>
          <Clock aria-hidden="true" />
          <strong>{estimatedReadingTime}</strong>
          <span>{t("transcript.readTime")}</span>
        </div>
      </div>

      <div className={styles.transcriptPaper}>
        <div className={styles.transcriptBody}>
          <div>
            {transcriptSegments.map((block, idx) => (
              <div key={idx} className={styles.transcriptSegment}>
                <div>
                  {block.time && (
                    <div className={styles.timestamp}>
                      <Clock aria-hidden="true" />
                      <span>{block.time}</span>
                    </div>
                  )}
                </div>
                <div
                  className={`${styles.proseContent} prose prose-slate max-w-none dark:prose-invert`}
                >
                  <ReactMarkdown components={transcriptMarkdownComponents}>
                    {block.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contentFooter}>
          <span className={styles.provenance}>
            {t("transcript.tips.autoGenerated")}
          </span>

          <button
            type="button"
            onClick={handleSaveToNotes}
            disabled={isSaving}
            className={styles.noteButton}
          >
            <Save className={isSaving ? "animate-spin" : ""} />
            {isSaving ? t("transcript.savingToNotes") : t("transcript.generateNote")}
          </button>
          {saveError && (
            <p className={`${styles.feedback} ${styles.feedbackError}`}>
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>
              {t("transcript.savedToNotes")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
