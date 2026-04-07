"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock,
  Copy,
  FileDown,
  Info,
  Save,
  ScrollText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

import { createLessonMarkdownComponents } from "@/features/courses/components/learn/markdownComponents";
import type { LearnLesson } from "@/features/courses/components/learn/types";

const transcriptMarkdownComponents = createLessonMarkdownComponents();

type TranscriptContentProps = {
  lesson: LearnLesson | null;
  slug: string;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  onStatsUpdate: (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => Promise<void>;
};

export function TranscriptContent({
  lesson,
  slug,
  onNoteCreated,
  onStatsUpdate,
}: TranscriptContentProps) {
  const { t, i18n } = useTranslation("learn");
  const selectedLang =
    i18n.language === "en" ? "en" : i18n.language === "pt" ? "pt" : "es";
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTranscript() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lesson.lesson_id}/transcript?language=${selectedLang}`
        );

        if (response.ok) {
          const data = await response.json();
          setTranscriptContent(data.transcript_content || null);
        } else {
          setTranscriptContent(null);
        }
      } catch {
        setTranscriptContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadTranscript();
  }, [lesson?.lesson_id, selectedLang, slug]);

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
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Transcripción del Video
          </h2>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#0A2540]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200 dark:border-white/5">
            <ScrollText className="w-8 h-8 text-gray-400 dark:text-white/20" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
            Selecciona una lección
          </h3>
          <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto">
            Selecciona una lección del panel izquierdo para ver su transcripción
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Transcripción del Video
          </h2>
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#0A2540]/20 dark:border-[#00D4B3]/20 animate-ping" />
            <div className="relative w-full h-full bg-[#0A2540]/10 dark:bg-[#00D4B3]/10 rounded-full flex items-center justify-center">
              <ScrollText className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3] animate-pulse" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-white/60 font-medium">
            {t("loading.transcript")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
            Transcripción Interactiva
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm">
            {lesson.lesson_title}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540] dark:bg-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {transcriptContent?.length || 0}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">
              caracteres
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <Clock className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {estimatedReadingTime}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">
              min
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {hasTranscript ? (
          <motion.div
            key="transcript-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1419]/40 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur-sm group"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#0A2540]/50 dark:via-[#00D4B3]/50 to-transparent opacity-50" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0A2540]/5 dark:bg-[#00D4B3]/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />

            <div className="relative p-8 prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown components={transcriptMarkdownComponents}>
                {transcriptContent || ""}
              </ReactMarkdown>
            </div>

            <div className="relative px-8 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-white/20 font-medium tracking-widest uppercase hidden md:block">
                Generado automáticamente
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-white/60 hover:text-[#0A2540] dark:hover:text-[#00D4B3] hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {isCopied ? "Copiado" : "Copiar"}
                </button>

                <button
                  onClick={handleDownloadTranscript}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-white/60 hover:text-[#0A2540] dark:hover:text-[#00D4B3] hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Descargar
                </button>

                <button
                  onClick={handleSaveToNotes}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#0A2540]/10 dark:bg-[#00D4B3]/10 text-[#0A2540] dark:text-[#00D4B3] hover:bg-[#0A2540]/20 dark:hover:bg-[#00D4B3]/20 border border-[#0A2540]/20 dark:border-[#00D4B3]/20 hover:border-[#0A2540]/40 dark:hover:border-[#00D4B3]/40 transition-all disabled:opacity-50"
                >
                  <Save
                    className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`}
                  />
                  {isSaving ? "Guardando..." : "Guardar en notas"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-transcript"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#0A2540]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200 dark:border-white/5">
              <ScrollText className="w-8 h-8 text-gray-400 dark:text-white/20" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
              Transcripción no disponible
            </h3>
            <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto mb-6">
              Esta lección aún no cuenta con una transcripción disponible.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-white/40">
              <Info className="w-4 h-4" />
              <span>El contenido se actualizará pronto</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
