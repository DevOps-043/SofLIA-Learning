"use client";

import { motion } from "framer-motion";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";

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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          title: title.trim() || null,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        const newQuestion = (await response.json()) as CourseQuestion;
        onSuccess(newQuestion);
        setTitle("");
        setContent("");
        return;
      }

      const errorData = (await response.json()) as { error?: string };
      alert(`Error: ${errorData.error || "No se pudo crear la pregunta"}`);
    } catch {
      alert("Error al crear la pregunta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl border border-gray-200 w-full max-w-2xl p-8 shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <MessageCircle className="w-24 h-24 text-gray-900" />
        </div>

        <h3 className="text-gray-900 font-semibold text-xl mb-6 relative z-10 font-[Inter,sans-serif]">
          Nueva pregunta
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Escribe un título breve..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A2540]/40 dark:focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#0A2540]/15 dark:focus:ring-[#00D4B3]/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
              Contenido <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Describe tu duda o comentario en detalle..."
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A2540]/40 dark:focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#0A2540]/15 dark:focus:ring-[#00D4B3]/20 transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:hover:bg-[#00b89a] text-white dark:text-[#0A1724] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#0A2540]/20 dark:hover:shadow-[#00D4B3]/20 text-sm font-semibold flex items-center gap-2"
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
    </div>
  );
}
