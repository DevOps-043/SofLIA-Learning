"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronDown,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

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
    questionCountLabel,
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

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="h-11 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-white/8 bg-white dark:bg-white/[0.02] p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-32" />
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-tour-id="course-learn--questions-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-24 md:pb-6"
    >
      {/* Header */}
      <div data-tour-id="course-learn--questions-header" className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 dark:from-accent/20 dark:to-primary/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              Preguntas
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/35 truncate">
              {questionCountLabel}
            </p>
          </div>
        </div>
        <motion.button
          data-tour-id="course-learn--new-question"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors hover:opacity-90 flex-shrink-0"
          style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva pregunta</span>
          <span className="sm:hidden">Nueva</span>
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/25 pointer-events-none" />
        <input
          data-tour-id="course-learn--questions-search"
          type="text"
          placeholder="Buscar en las preguntas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/8 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-primary/40 dark:focus:border-accent/40 focus:bg-white dark:focus:bg-white/[0.06] focus:ring-0 transition-all"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Empty state */}
      {questions.length === 0 ? (
        <motion.div
          data-tour-id="course-learn--questions-empty"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7" style={{ color: 'var(--learn-accent)' }} />
          </div>
          <div className="text-center">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-1">
              {activeSearchQuery ? "Sin resultados" : "No hay preguntas"}
            </h3>
            <p className="text-gray-500 dark:text-white/40 text-sm">
              {activeSearchQuery
                ? "No se encontraron resultados para tu búsqueda"
                : "Sé el primero en iniciar una conversación"}
            </p>
          </div>
          {!activeSearchQuery && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateForm(true)}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
            >
              <Plus className="w-4 h-4" />
              Hacer primera pregunta
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => {
            const isSelected = selectedQuestionId === question.id;
            const isLiked = userReactions[question.id] === "like";
            const preview = question.content.length > 140
              ? `${question.content.substring(0, 140)}…`
              : question.content;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? ""
                    : "border-gray-100 dark:border-white/8 bg-white dark:bg-white/[0.03] hover:border-gray-200 dark:hover:border-white/12 hover:bg-gray-50/80 dark:hover:bg-white/[0.05]"
                }`}
                style={isSelected ? {
                  borderColor: 'color-mix(in srgb, var(--learn-accent) 25%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--learn-accent) 4%, transparent)',
                } : undefined}
              >
                {/* Card body */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleQuestionSelection(question.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0 text-white">
                      {question.user?.profile_picture_url ? (
                        <Image
                          src={question.user.profile_picture_url}
                          alt={getQuestionUserDisplayName(question.user)}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-xs">
                          {getQuestionUserInitials(question.user)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Meta */}
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                          {getQuestionUserDisplayName(question.user)}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-white/30">•</span>
                        <span className="text-xs text-gray-400 dark:text-white/35">
                          {formatQuestionTimeAgo(question.created_at)}
                        </span>
                        {question.is_pinned && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-400/10 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-400/20">
                            Fijada
                          </span>
                        )}
                        {question.is_resolved && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 rounded-full border border-emerald-200 dark:border-emerald-400/20">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Resuelta
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-gray-600 dark:text-white/65 text-sm leading-relaxed">
                        {isSelected ? question.content : preview}
                      </p>

                      {/* Tags */}
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {question.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full border" style={{
                              color: 'color-mix(in srgb, var(--learn-accent) 70%, transparent)',
                              backgroundColor: 'color-mix(in srgb, var(--learn-accent) 5%, transparent)',
                              borderColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)',
                            }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer stats */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleReaction(question.id); }}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          isLiked ? "text-red-500" : "text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                        <span>{reactionCounts[question.id] ?? question.reaction_count ?? 0}</span>
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{question.response_count}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{question.view_count}</span>
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'color-mix(in srgb, var(--learn-accent) 60%, transparent)' }}>
                      {isSelected ? (
                        <>Cerrar <ChevronDown className="w-3 h-3" /></>
                      ) : (
                        <>Ver conversación <ChevronDown className="w-3 h-3 -rotate-90" /></>
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded thread */}
                <AnimatePresence>
                  {isSelected && (
                    <QuestionThread questionId={question.id} slug={slug} />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {hasMore && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-2">
              <button
                onClick={() => void loadMoreQuestions()}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Cargando...</span></>
                ) : (
                  <><Plus className="w-4 h-4" /><span>Cargar más</span></>
                )}
              </button>
            </motion.div>
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
    </motion.div>
  );
}
