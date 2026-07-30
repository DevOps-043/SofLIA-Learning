"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  LoaderCircle,
  MessageCircleMore,
  Plus,
  Send,
  Tag,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./CommunityExperience.module.css";
import type { CourseQuestion } from "./questions/types";
import { createClient } from "@/lib/supabase/client";
import { logger as techDebtLogger } from "@/lib/utils/logger";

type CreateQuestionFormProps = {
  lessonId: string;
  onClose: () => void;
  onSuccess: (question?: CourseQuestion) => void;
  slug: string;
};

export function CreateQuestionForm({
  lessonId,
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
  const [user, setUser] = useState<CourseQuestion["user"] | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: profile } = await supabase
          .from("users")
          .select(
            "id, username, display_name, first_name, last_name, profile_picture_url",
          )
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setUser(profile);
        }
      } catch (error) {
        techDebtLogger.error("Error loading user profile on client:", error);
      }
    };

    void loadUser();

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
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
      setTags((currentTags) => [...currentTags, trimmed]);
    }
    setTagInput("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const response = await fetch(`/api/courses/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: null,
          content: content.trim(),
          lesson_id: lessonId,
          tags,
        }),
      });

      if (response.ok) {
        const newQuestion = (await response.json()) as CourseQuestion;
        onSuccess(newQuestion);
        setContent("");
        setTags([]);
        return;
      }

      const errorData = (await response.json()) as {
        error?: string;
        message?: string;
      };
      setSubmitError(
        errorData.message ||
          errorData.error ||
          "No se pudo crear la pregunta",
      );
    } catch {
      setSubmitError("Error al crear la pregunta");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const animationInitial = isMobile
    ? { y: "100%", opacity: 0.85 }
    : { scale: 0.97, y: 10, opacity: 0 };
  const animationAnimate = isMobile
    ? { y: 0, opacity: 1 }
    : { scale: 1, y: 0, opacity: 1 };
  const animationExit = isMobile
    ? { y: "100%", opacity: 0.85 }
    : { scale: 0.97, y: 8, opacity: 0 };
  const displayName =
    user?.display_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    "Tu perfil";

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.modalScrim}
      />

      <motion.div
        initial={animationInitial}
        animate={animationAnimate}
        exit={animationExit}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-question-title"
        aria-describedby="create-question-description"
      >
        <header className={styles.modalHeader}>
          <div className={styles.modalHeading}>
            <span className={styles.headerIcon} aria-hidden="true">
              <MessageCircleMore />
            </span>
            <div className="min-w-0">
              <h3 id="create-question-title" className={styles.modalTitle}>
                Nueva pregunta
              </h3>
              <p
                id="create-question-description"
                className={styles.modalSubtitle}
              >
                Comparte una duda clara con tu comunidad.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.iconButton}
            aria-label="Cerrar"
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.profile}>
            <span className={styles.avatar}>
              {user?.profile_picture_url ? (
                <Image
                  src={user.profile_picture_url}
                  alt={displayName}
                  fill
                  sizes="38px"
                  className="object-cover"
                />
              ) : (
                (
                  user?.first_name?.[0] ||
                  user?.username?.[0] ||
                  "U"
                ).toUpperCase()
              )}
            </span>
            <div>
              <span className={styles.profileEyebrow}>Publicar como</span>
              <span className={styles.profileName}>{displayName}</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            id="create-question-form"
            className={styles.form}
          >
            <label className={styles.field}>
              <span className={styles.label}>Tu pregunta</span>
              <span className={styles.textareaFrame}>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Explica qué intentaste y en qué parte necesitas apoyo…"
                  required
                  rows={isMobile ? 5 : 7}
                  maxLength={1200}
                  className={styles.modalTextarea}
                  autoFocus={!isMobile}
                />
                <span className={styles.fieldHint}>
                  <span>Sé clara y añade el contexto necesario.</span>
                  <span>{content.length}/1200</span>
                </span>
              </span>
            </label>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <span className={styles.label}>
                  <Tag aria-hidden="true" />
                  Etiquetas
                </span>
                <span className={styles.optionalLabel}>Opcional</span>
              </div>
              <div className={styles.tagComposer}>
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
                  placeholder="Evaluación, ejercicio…"
                  className={styles.tagInput}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={styles.secondaryButton}
                  disabled={!tagInput.trim()}
                >
                  <Plus aria-hidden="true" />
                  <span>Añadir</span>
                </button>
              </div>

              {tags.length > 0 && (
                <div className={styles.tagList}>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      className={styles.tagButton}
                      onClick={() =>
                        setTags((currentTags) =>
                          currentTags.filter(
                            (currentTag) => currentTag !== tag,
                          ),
                        )
                      }
                      title="Quitar etiqueta"
                      type="button"
                    >
                      #{tag}
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {submitError && <p className={styles.error}>{submitError}</p>}
          </form>
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={styles.secondaryButton}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-question-form"
            disabled={isSubmitting || !content.trim()}
            className={styles.primaryButton}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {isSubmitting ? "Publicando…" : "Publicar pregunta"}
          </button>
        </footer>
      </motion.div>
    </div>,
    document.body,
  );
}
