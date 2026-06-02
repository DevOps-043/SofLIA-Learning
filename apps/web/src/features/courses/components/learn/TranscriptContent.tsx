"use client";

import { useState } from "react";
import { Clock, Info, Save, ScrollText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

import { createLessonMarkdownComponents } from "@/features/courses/components/learn/markdownComponents";
import type { LearnLesson } from "@/features/courses/components/learn/types";
import { ReadingVoiceButton } from "@/features/courses/components/learn/reading-voice/ReadingVoiceButton";
import { useReadingVoice } from "@/features/courses/components/learn/reading-voice/useReadingVoice";

const transcriptMarkdownComponents = createLessonMarkdownComponents();

function parseTranscriptSegments(text: string) {
  if (!text) return [];
  // Detects timestamps like [00:00], (1:23:45) at the start of lines
  const regex = /(?:^|\n)\s*[\[\(](\d{1,2}:\d{2}(?::\d{2})?)[\]\)]\s*/;
  const parts = text.split(regex);
  const blocks: { time: string | null; content: string }[] = [];
  
  if (parts[0] && parts[0].trim()) {
    blocks.push({ time: null, content: parts[0].trim() });
  }
  
  for (let i = 1; i < parts.length; i += 2) {
    const time = parts[i];
    const content = parts[i + 1]?.trim() || "";
    if (time || content) {
      blocks.push({ time, content });
    }
  }
  
  return blocks;
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
  const { status: voiceStatus, speak: speakTranscript } = useReadingVoice();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasTranscript = Boolean(
    transcriptContent && transcriptContent.trim().length > 0
  );
  const estimatedReadingTime = transcriptContent
    ? Math.ceil(transcriptContent.split(/\s+/).length / 200)
    : 0;

  const handleSaveToNotes = async () => {
    if (!transcriptContent || !lesson) {
      return;
    }

    setIsSaving(true);

    try {
      const notePayload = {
        note_title: `${t("transcript.noteTitle")}: ${lesson.lesson_title}`,
        note_content: transcriptContent,
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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-accent/10">
            <ScrollText className="h-4 w-4 animate-pulse text-primary dark:text-accent" />
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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900/40">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-accent/10">
            <Info className="h-4 w-4 text-primary dark:text-accent" />
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
          <div className="h-1.5 w-1.5 rounded-full bg-primary dark:bg-accent" />
          <span className="font-medium">{transcriptContent?.length || 0}</span>
          <span className="text-xs">{t("transcript.characters")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 font-sans">
          <Clock className="h-3.5 w-3.5 text-primary dark:text-accent" />
          <span className="font-medium">{estimatedReadingTime}</span>
          <span className="text-xs">{t("transcript.readTime")}</span>
        </div>
        <div className="ml-auto">
          <ReadingVoiceButton status={voiceStatus} t={t} onClick={() => speakTranscript(transcriptContent)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900/50">
        <div className="p-6">
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {parseTranscriptSegments(transcriptContent || "").map((block, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-6 py-5 first:pt-0 last:pb-0">
                {/* Time column */}
                <div className="sm:w-28 shrink-0">
                  {block.time && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-1 text-sm font-medium text-primary dark:border-accent/20 dark:bg-accent/10 dark:text-accent">
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
              className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/[0.08] px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:opacity-60 dark:border-accent/20 dark:bg-accent/10 dark:text-accent dark:hover:bg-accent/15"
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
