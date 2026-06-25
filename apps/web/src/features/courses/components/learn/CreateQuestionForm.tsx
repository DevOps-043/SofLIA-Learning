"use client";

import { motion } from "framer-motion";
import { Loader2, MessageCircle, Send, X, Tag } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { CourseQuestion } from "./questions/types";
import { createClient } from "@/lib/supabase/client";

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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const loadUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from("users")
            .select("id, username, display_name, first_name, last_name, profile_picture_url")
            .eq("id", authUser.id)
            .single();
          if (profile) {
            setUser(profile);
          }
        }
      } catch (err) {
        console.error("Error loading user profile on client:", err);
      }
    };

    void loadUser();

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/#/g, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

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
          tags: tags,
        }),
      });

      if (response.ok) {
        const newQuestion = (await response.json()) as CourseQuestion;
        onSuccess(newQuestion);
        setContent("");
        setTags([]);
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

  // Animation values based on responsive breakpoint
  const animationInitial = isMobile ? { y: "100%", opacity: 0.8 } : { scale: 0.95, opacity: 0 };
  const animationAnimate = isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 };
  const animationExit = isMobile ? { y: "100%", opacity: 0.8 } : { scale: 0.95, opacity: 0 };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-question-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={animationInitial}
        animate={animationAnimate}
        exit={animationExit}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-gray-200/80 dark:border-white/10 shadow-2xl dark:shadow-black/60 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Pull tab for mobile drawer */}
        <div className="w-12 h-1 bg-gray-300 dark:bg-white/10 rounded-full mx-auto my-3 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-white/5 shrink-0 bg-gray-50/50 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)',
              }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--learn-accent)' }} />
            </div>
            <div>
              <h3
                id="create-question-title"
                className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg leading-none"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
              >
                Nueva pregunta
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-white/40 mt-1">
                Pregunta a la comunidad del taller
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* User profile section */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/5">
            {user?.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={user.display_name || ""}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold uppercase shadow-inner">
                {user ? (user.first_name?.[0] || user.username?.[0] || "U").toUpperCase() : "U"}
              </div>
            )}
            <div>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {user ? (user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.username) : "Cargando..."}
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-white/40">
                Publicando en el taller
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="create-question-form" className="space-y-4">
            {/* Content field */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Contenido <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Describe tu duda o comentario en detalle..."
                required
                rows={isMobile ? 4 : 6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-primary/40 dark:focus:border-accent/50 focus:ring-1 focus:ring-primary/15 dark:focus:ring-accent/20 transition-all resize-none leading-relaxed text-sm"
              />
              <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-white/30 px-1">
                <span>Por favor, sé descriptivo y conciso.</span>
                <span>{content.length} caracteres</span>
              </div>
            </div>

            {/* Tags field */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Etiquetas <span className="text-[10px] text-gray-400 dark:text-white/20 lowercase font-normal">(opcional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Ej. api, css, bug"
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-primary/40 dark:focus:border-accent/50 focus:ring-1 focus:ring-primary/15 dark:focus:ring-accent/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl text-xs font-semibold transition-colors border border-gray-200 dark:border-white/10 shrink-0"
                >
                  Añadir
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all hover:bg-red-50 hover:text-red-500 hover:border-red-200 group/tag cursor-pointer"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--learn-accent) 5%, transparent)',
                        color: 'var(--learn-accent)',
                        borderColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)',
                      }}
                      onClick={() => handleRemoveTag(tag)}
                      title="Haz clic para eliminar"
                    >
                      #{tag}
                      <span className="text-[9px] font-bold opacity-45 group-hover/tag:opacity-100 transition-opacity ml-0.5">
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {submitError && (
              <p className="text-xs text-red-500 dark:text-red-400 pt-1 font-medium">{submitError}</p>
            )}
          </form>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-gray-100 dark:border-white/5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-gray-50/30 dark:bg-white/[0.005] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-question-form"
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:brightness-95 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
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
      </motion.div>
    </div>,
    document.body
  );
}
