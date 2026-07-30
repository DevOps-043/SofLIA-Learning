"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  Heart,
  LoaderCircle,
  MessageCircleMore,
  MessageSquareText,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import styles from "./CommunityExperience.module.css";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionThread } from "./QuestionThread";
import { useCourseQuestions } from "./questions/useCourseQuestions";
import {
  formatQuestionTimeAgo,
  getQuestionUserDisplayName,
  getQuestionUserInitials,
} from "./questions/utils";

type QuestionsSectionProps = {
  lessonId: string;
  slug: string;
};

export function QuestionsSection({ lessonId, slug }: QuestionsSectionProps) {
  const { t } = useTranslation("learn");
  const {
    activeSearchQuery,
    handleClearSearch,
    handleQuestionCreated,
    handleReaction,
    handleSearch,
    hasMore,
    loading,
    loadingMore,
    loadMoreQuestions,
    questions,
    reactionCounts,
    searchQuery,
    selectedQuestionId,
    setSearchQuery,
    setShowCreateForm,
    showCreateForm,
    toggleQuestionSelection,
    userReactions,
  } = useCourseQuestions({ lessonId, slug });

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
    if (event.key === "Escape" && searchQuery) {
      event.preventDefault();
      handleClearSearch();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingShell} aria-label="Cargando conversaciones">
        <div className={styles.loadingHeader}>
          <div className={styles.loadingTitle} />
          <div className={styles.loadingButton} />
        </div>
        <div className={styles.loadingSearch} />
        {[1, 2, 3].map((item) => (
          <div className={styles.loadingCard} key={item} />
        ))}
      </div>
    );
  }

  return (
    <motion.section
      data-tour-id="course-learn--questions-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.shell}
    >
      <header
        data-tour-id="course-learn--questions-header"
        className={styles.header}
      >
        <div className={styles.headerIdentity}>
          <span className={styles.headerIcon} aria-hidden="true">
            <MessageCircleMore />
          </span>
          <div className="min-w-0">
            <h2 className={styles.title}>{t("questions.title")}</h2>
          </div>
        </div>

        <button
          data-tour-id="course-learn--new-question"
          onClick={() => setShowCreateForm(true)}
          className={styles.primaryButton}
          type="button"
        >
          <Plus aria-hidden="true" />
          <span className={styles.primaryButtonLabel}>Nueva pregunta</span>
        </button>
      </header>

      <div className={styles.searchPanel}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          data-tour-id="course-learn--questions-search"
          type="search"
          aria-label="Buscar en las preguntas"
          placeholder="Buscar por pregunta, respuesta o etiqueta…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className={styles.clearSearch}
            aria-label="Limpiar búsqueda"
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <motion.div
          data-tour-id="course-learn--questions-empty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.emptyState}
        >
          <span className={styles.emptyIcon} aria-hidden="true">
            <MessageSquareText />
          </span>
          <h3 className={styles.emptyTitle}>
            {activeSearchQuery ? "Sin coincidencias" : "Inicia la conversación"}
          </h3>
          <p className={styles.emptyDescription}>
            {activeSearchQuery
              ? "Prueba una búsqueda más breve o limpia el filtro."
              : "Sé la primera persona en compartir una pregunta sobre esta lección."}
          </p>
          {!activeSearchQuery && (
            <button
              onClick={() => setShowCreateForm(true)}
              className={styles.primaryButton}
              type="button"
            >
              <Plus aria-hidden="true" />
              Hacer una pregunta
            </button>
          )}
        </motion.div>
      ) : (
        <div className={styles.questionList}>
          {questions.map((question, index) => {
            const isSelected = selectedQuestionId === question.id;
            const isLiked = userReactions[question.id] === "like";
            const preview =
              question.content.length > 180
                ? `${question.content.substring(0, 180)}…`
                : question.content;

            return (
              <motion.article
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.035, 0.18) }}
                className={`${styles.questionCard} ${
                  isSelected ? styles.questionCardOpen : ""
                }`}
              >
                <div
                  className={styles.questionBody}
                  onClick={() => toggleQuestionSelection(question.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleQuestionSelection(question.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSelected}
                >
                  <div className={styles.questionMain}>
                    <span className={styles.avatar}>
                      {question.user?.profile_picture_url ? (
                        <Image
                          src={question.user.profile_picture_url}
                          alt={getQuestionUserDisplayName(question.user)}
                          fill
                          sizes="38px"
                          className="object-cover"
                        />
                      ) : (
                        getQuestionUserInitials(question.user)
                      )}
                    </span>

                    <div className={styles.questionCopy}>
                      <div className={styles.metaRow}>
                        <span className={styles.author}>
                          {getQuestionUserDisplayName(question.user)}
                        </span>
                        <span className={styles.timestamp}>
                          {formatQuestionTimeAgo(question.created_at)}
                        </span>
                        {question.is_pinned && (
                          <span className={styles.statusBadge}>Fijada</span>
                        )}
                        {question.is_resolved && (
                          <span className={styles.statusBadge}>
                            <CheckCircle2 aria-hidden="true" />
                            Resuelta
                          </span>
                        )}
                      </div>

                      <p className={styles.questionContent}>
                        {isSelected ? question.content : preview}
                      </p>

                      {question.tags && question.tags.length > 0 && (
                        <div className={styles.tags}>
                          {question.tags.map((tag) => (
                            <span className={styles.tag} key={tag}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.questionFooter}>
                    <div className={styles.stats}>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleReaction(question.id);
                        }}
                        className={`${styles.statButton} ${
                          isLiked ? styles.statButtonActive : ""
                        }`}
                        aria-label={isLiked ? "Quitar Me gusta" : "Marcar Me gusta"}
                        type="button"
                      >
                        <Heart
                          aria-hidden="true"
                          className={isLiked ? "fill-current" : ""}
                        />
                        {reactionCounts[question.id] ??
                          question.reaction_count ??
                          0}
                      </button>
                      <span className={styles.stat}>
                        <MessageSquareText aria-hidden="true" />
                        {question.response_count}
                      </span>
                      <span className={styles.stat}>
                        <Eye aria-hidden="true" />
                        {question.view_count}
                      </span>
                    </div>

                    <span className={styles.threadToggle}>
                      <span>{isSelected ? "Cerrar" : "Abrir conversación"}</span>
                      {isSelected ? (
                        <ChevronDown aria-hidden="true" />
                      ) : (
                        <ArrowUpRight aria-hidden="true" />
                      )}
                    </span>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isSelected && (
                    <QuestionThread questionId={question.id} slug={slug} />
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}

          {hasMore && (
            <div className={styles.loadMore}>
              <button
                onClick={() => void loadMoreQuestions()}
                disabled={loadingMore}
                className={styles.secondaryButton}
                type="button"
              >
                {loadingMore ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Cargando…
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    Ver más conversaciones
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateForm && (
          <CreateQuestionForm
            lessonId={lessonId}
            slug={slug}
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleQuestionCreated}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
