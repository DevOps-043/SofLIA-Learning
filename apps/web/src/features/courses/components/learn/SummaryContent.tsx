"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Copy,
  FileText,
  Info,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

import { createLessonMarkdownComponents } from "@/features/courses/components/learn/markdownComponents";
import type { LearnLesson } from "@/features/courses/components/learn/types";

const summaryMarkdownComponents = createLessonMarkdownComponents({
  includeCode: true,
});

type SummaryContentProps = {
  lesson: LearnLesson;
  slug: string;
};

export function SummaryContent({ lesson, slug }: SummaryContentProps) {
  const { t, i18n } = useTranslation("learn");
  const selectedLang =
    i18n.language === "en" ? "en" : i18n.language === "pt" ? "pt" : "es";
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      if (!lesson?.lesson_id || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lesson.lesson_id}/summary?language=${selectedLang}`
        );

        if (response.ok) {
          const data = await response.json();
          setSummaryContent(data.summary_content || null);
        } else {
          setSummaryContent(null);
        }
      } catch {
        setSummaryContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [lesson?.lesson_id, selectedLang, slug]);

  const hasSummary = Boolean(summaryContent && summaryContent.trim().length > 0);
  const estimatedReadingTime = summaryContent
    ? Math.ceil(summaryContent.split(/\s+/).length / 200)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Resumen del Video
          </h2>
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#0A2540]/20 dark:border-[#00D4B3]/20 animate-ping" />
            <div className="relative w-full h-full bg-[#0A2540]/10 dark:bg-[#00D4B3]/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3] animate-pulse" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-white/60 font-medium">
            {t("loading.summary")}
          </p>
        </div>
      </div>
    );
  }

  if (!hasSummary) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[Inter]">
            Resumen del Video
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm">
            {lesson.lesson_title}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#0A2540]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200 dark:border-white/5">
            <FileText className="w-8 h-8 text-gray-400 dark:text-white/20" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
            Resumen no disponible
          </h3>
          <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto mb-6">
            Esta lección aún no cuenta con un resumen generado automáticamente.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-white/40">
            <Info className="w-4 h-4" />
            <span>El contenido se actualizará pronto</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
            Resumen Inteligente
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm">
            {lesson.lesson_title}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#0A2540]/30 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540] dark:bg-[#00D4B3]" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {summaryContent?.split(/\s+/).length || 0}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/40">
              palabras
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1419]/40 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur-sm group"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#0A2540]/50 dark:via-[#00D4B3]/50 to-transparent opacity-50" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0A2540]/5 dark:bg-[#00D4B3]/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />

        <div className="relative p-8 prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown components={summaryMarkdownComponents}>
            {summaryContent || ""}
          </ReactMarkdown>
        </div>

        <div className="relative px-8 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-white/20 font-medium tracking-widest uppercase">
            Generado por IA • Revisado por expertos
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(summaryContent || "");
            }}
            className="p-2 text-gray-400 dark:text-white/20 hover:text-[#0A2540] dark:hover:text-[#00D4B3] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#00D4B3]/10"
            title="Copiar resumen"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
