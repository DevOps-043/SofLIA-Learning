"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, FileDown, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { exportNotePdfWithPdfMake } from "@/core/components/NotesModal/shared/notes-pdf-pdfmake.service";
import { sanitizeHtml } from "@/lib/sanitize/html-sanitizer";
import type { LearnGeneratedModuleSummary } from "../types";

type ModuleLearningSummaryViewerModalProps = {
  isOpen: boolean;
  isRegenerating: boolean;
  onClose: () => void;
  onDuplicate?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  onRegenerate?: () => void;
  summary: LearnGeneratedModuleSummary | null;
  summaryPosition?: {
    current: number;
    total: number;
  };
};

export function ModuleLearningSummaryViewerModal({
  isOpen,
  isRegenerating,
  onClose,
  onDuplicate,
  onNavigateNext,
  onNavigatePrevious,
  onRegenerate,
  summary,
  summaryPosition,
}: ModuleLearningSummaryViewerModalProps) {
  const { i18n, t } = useTranslation("common");
  const { t: tl } = useTranslation("learn");
  const [pdfError, setPdfError] = useState<string | null>(null);

  const canRegenerate =
    Boolean(summary?.canRegenerate) && summary?.status !== "generating";
  const canNavigatePrevious = Boolean(onNavigatePrevious);
  const canNavigateNext = Boolean(onNavigateNext);
  const safeContent = useMemo(
    () =>
      sanitizeHtml(summary?.fullContent || "", {
        level: "rich",
      }),
    [summary?.fullContent]
  );

  const handleExportPdf = async () => {
    if (!summary) {
      return;
    }

    try {
      setPdfError(null);
      await exportNotePdfWithPdfMake(
        {
          content: safeContent,
          tags: [],
          title: summary.title,
        },
        {
          labels: {
            generatedBy: t("notes.pdf.generatedBy"),
            page: t("notes.pdf.page"),
            tags: t("notes.pdf.tags"),
            untitled: t("notes.pdf.untitled"),
          },
          locale: i18n.language || "es",
        }
      );
    } catch (error) {
      setPdfError(
        error instanceof Error ? error.message : t("notes.modal.exportPdfError")
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && summary ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm md:p-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          {pdfError ? (
            <div className="fixed bottom-4 left-1/2 z-[10000] -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {pdfError}
            </div>
          ) : null}

          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-900 md:h-[82vh]"
            exit={{ opacity: 0, scale: 0.96 }}
            initial={{ opacity: 0, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-white/10">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    {tl("leftPanel.notesSection.generatedSummaryBadge")}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    {tl("leftPanel.notesSection.summaryVersion", {
                      version: summary.version,
                      total: 4,
                    })}
                  </span>
                  {summaryPosition && summaryPosition.total > 1 ? (
                    <span className="text-xs text-gray-500 dark:text-white/50">
                      {summaryPosition.current} / {summaryPosition.total}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-2 truncate text-lg font-semibold text-gray-900 dark:text-white">
                  {summary.title}
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                  disabled={!canNavigatePrevious}
                  onClick={onNavigatePrevious}
                  title={tl("leftPanel.notesSection.previousSummary")}
                  type="button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                  disabled={!canNavigateNext}
                  onClick={onNavigateNext}
                  title={tl("leftPanel.notesSection.nextSummary")}
                  type="button"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={onClose}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-white/10 dark:bg-gray-900">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                onClick={onDuplicate}
                type="button"
              >
                <Copy className="h-4 w-4" />
                {t("notes.modal.toolbar.duplicateNote")}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                onClick={handleExportPdf}
                type="button"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </button>
              {onRegenerate ? (
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-accent/30 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-accent"
                  disabled={!canRegenerate || isRegenerating}
                  onClick={onRegenerate}
                  type="button"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
                  />
                  {canRegenerate
                    ? tl("leftPanel.notesSection.regenerateSummary")
                    : tl("leftPanel.notesSection.summaryLimitReached")}
                </button>
              ) : null}
            </div>

            <main className="flex-1 overflow-y-auto px-6 py-6">
              {summary.status !== "ready" ? (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
                  {summary.status === "generating"
                    ? tl("leftPanel.notesSection.summaryGenerating")
                    : summary.errorMessage ||
                      tl("leftPanel.notesSection.summaryFailed")}
                </div>
              ) : null}
              <article
                className="notes-editor prose max-w-none text-gray-900 dark:prose-invert dark:text-white/90"
                dangerouslySetInnerHTML={{
                  __html: safeContent,
                }}
              />
            </main>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
