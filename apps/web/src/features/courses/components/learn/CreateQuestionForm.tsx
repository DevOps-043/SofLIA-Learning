"use client";

import { motion } from "framer-motion";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { CourseQuestion } from "./questions/types";

type CreateQuestionFormProps = {
  onClose: () => void;
  onSuccess: (question?: CourseQuestion) => void;
  slug: string;
};

export function CreateQuestionForm({
  onClose,
  onSuccess,
  slug,
}: CreateQuestionFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/courses/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: null,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        const newQuestion = (await response.json()) as CourseQuestion;
        onSuccess(newQuestion);
        setContent("");
        return;
      }

      const errorData = (await response.json()) as { error?: string };
      setSubmitError(errorData.error || "No se pudo crear la pregunta");
    } catch {
      setSubmitError("Error al crear la pregunta");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-question-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-white/10 p-5 sm:p-6 md:p-8 shadow-2xl dark:shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
          <MessageCircle className="w-24 h-24 text-gray-900 dark:text-white" />
        </div>

        <h3
          id="create-question-title"
          className="text-gray-900 dark:text-white font-semibold text-lg sm:text-xl mb-5 sm:mb-6 relative z-10 font-[Inter,sans-serif]"
        >
          Nueva pregunta
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
              Contenido <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Describe tu duda o comentario en detalle..."
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/40 dark:focus:border-accent/50 focus:ring-1 focus:ring-primary/15 dark:focus:ring-accent/20 transition-all resize-none leading-relaxed"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-500 dark:text-red-400">{submitError}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 bg-primary hover:bg-primary dark:bg-accent dark:hover:bg-accent text-white dark:text-[var(--color-legacy-0a1724)] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20 dark:hover:shadow-accent/20 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publicar pregunta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
