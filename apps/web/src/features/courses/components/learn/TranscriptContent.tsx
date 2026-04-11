"use client";

import { useState } from "react";
import { Check, Clock, Copy, FileDown, Info, Save, ScrollText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

import { createLessonMarkdownComponents } from "@/features/courses/components/learn/markdownComponents";
import type { LearnLesson } from "@/features/courses/components/learn/types";

const transcriptMarkdownComponents = createLessonMarkdownComponents();

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
  const [isCopied, setIsCopied] = useState(false);

  const hasTranscript = Boolean(
    transcriptContent && transcriptContent.trim().length > 0
  );
  const estimatedReadingTime = transcriptContent
    ? Math.ceil(transcriptContent.split(/\s+/).length / 200)
    : 0;

  const handleDownloadTranscript = () => {
    if (!transcriptContent || !lesson) {
      return;
    }

    const blob = new Blob([transcriptContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcripcion-${lesson.lesson_title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!transcriptContent) {
      return;
    }

    try {
      await navigator.clipboard.writeText(transcriptContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert("Error al copiar al portapapeles");
    }
  };

  const handleSaveToNotes = async () => {
    if (!transcriptContent || !lesson) {
      return;
    }

    setIsSaving(true);

    try {
      const notePayload = {
        note_title: `Transcripción: ${lesson.lesson_title}`,
        note_content: transcriptContent,
        note_tags: ["transcripción", "automática"],
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
            : { error: "Respuesta vacía del servidor" };
        } catch {
          errorData = { error: "Error al procesar respuesta del servidor" };
        }

        alert(
          `Error al guardar la transcripción en notas:\n\n${
            errorData.error || "Error desconocido"
          }\n\nDetalles: ${
            errorData.message || "Sin detalles adicionales"
          }\n\nCódigo de estado: ${response.status}`
        );
        return;
      }

      const newNote = (await response.json()) as unknown;

      if (lesson.lesson_id) {
        onNoteCreated(newNote, lesson.lesson_id);
        await onStatsUpdate("create", lesson.lesson_id);
      }

      alert("✅ Transcripción guardada exitosamente en notas");
    } catch (error) {
      alert(
        `❌ Error al guardar la transcripción en notas:\n\n${
          error instanceof Error ? error.message : "Error desconocido"
        }\n\nRevisa la consola para más detalles.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!lesson) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D7DEE6] bg-white p-5 dark:border-white/10 dark:bg-[#0F1419]/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A2540]/10 dark:bg-[#00D4B3]/10">
            <ScrollText className="h-4 w-4 animate-pulse text-[#0A2540] dark:text-[#00D4B3]" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
          </div>
        </div>
        <p className="mt-4 text-sm text-[#6C757D] dark:text-white/60">
          {t("loading.transcript")}
        </p>
      </div>
    );
  }

  if (!hasTranscript) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D7DEE6] bg-white p-5 dark:border-white/10 dark:bg-[#0F1419]/40">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A2540]/10 dark:bg-[#00D4B3]/10">
            <Info className="h-4 w-4 text-[#0A2540] dark:text-[#00D4B3]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0A2540] dark:text-white">
              {t("transcript.notAvailable")}
            </h3>
            <p className="mt-1 text-sm text-[#6C757D] dark:text-white/60">
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
        <div className="flex items-center gap-2 rounded-full border border-[#0A2540]/10 bg-white px-3 py-1.5 text-sm text-[#44556B] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0A2540] dark:bg-[#00D4B3]" />
          <span className="font-medium">{transcriptContent?.length || 0}</span>
          <span className="text-xs">{t("transcript.characters")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#0A2540]/10 bg-white px-3 py-1.5 text-sm text-[#44556B] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <Clock className="h-3.5 w-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
          <span className="font-medium">{estimatedReadingTime}</span>
          <span className="text-xs">{t("transcript.readTime")}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1419]/50">
        <div className="prose prose-slate max-w-none p-6 dark:prose-invert">
          <ReactMarkdown components={transcriptMarkdownComponents}>
            {transcriptContent || ""}
          </ReactMarkdown>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E9ECEF] bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#6C757D] dark:text-white/30">
            {t("transcript.tips.autoGenerated")}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-[#44556B] transition-colors hover:border-[#D7DEE6] hover:bg-white hover:text-[#0A2540] dark:text-white/60 dark:hover:border-white/10 dark:hover:bg-white/[0.04] dark:hover:text-[#00D4B3]"
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {isCopied ? t("transcript.copied") : t("transcript.copy")}
            </button>

            <button
              type="button"
              onClick={handleDownloadTranscript}
              className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-[#44556B] transition-colors hover:border-[#D7DEE6] hover:bg-white hover:text-[#0A2540] dark:text-white/60 dark:hover:border-white/10 dark:hover:bg-white/[0.04] dark:hover:text-[#00D4B3]"
            >
              <FileDown className="h-3.5 w-3.5" />
              {t("transcript.download")}
            </button>

            <button
              type="button"
              onClick={handleSaveToNotes}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg border border-[#0A2540]/15 bg-[#0A2540]/8 px-4 py-1.5 text-xs font-medium text-[#0A2540] transition-colors hover:bg-[#0A2540]/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#00D4B3]/20 dark:bg-[#00D4B3]/10 dark:text-[#00D4B3] dark:hover:bg-[#00D4B3]/15"
            >
              <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? t("transcript.savingToNotes") : t("transcript.saveToNotes")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
