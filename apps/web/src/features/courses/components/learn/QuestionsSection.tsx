"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
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
  slug: string;
};

export function QuestionsSection({ slug }: QuestionsSectionProps) {
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
  } = useCourseQuestions({ slug });

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 pb-24 md:pb-6"
      >
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center mb-4"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.div>
          <p className="text-white/50 text-sm">{t("loading.questions")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24 md:pb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preguntas
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {questionCountLabel}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:hover:bg-[#00b89a] text-white dark:text-[#0A1724] text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva pregunta
        </motion.button>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Buscar en las preguntas..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#0A2540]/40 dark:focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#0A2540]/15 dark:focus:ring-[#00D4B3]/20 transition-colors shadow-sm dark:shadow-none"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-12 flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3]/50 flex items-center justify-center mb-5"
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-gray-900 dark:text-white text-lg font-medium mb-2">
            No hay preguntas
          </h3>
          <p className="text-gray-500 dark:text-white/40 text-sm text-center mb-6 max-w-sm">
            {activeSearchQuery
              ? "No se encontraron resultados para tu búsqueda"
              : "Sé el primero en iniciar una conversación"}
          </p>
          {!activeSearchQuery && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:hover:bg-[#00b89a] text-white dark:text-[#0A1724] text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Hacer primera pregunta
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.005 }}
              className="group rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all duration-300 overflow-hidden shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80 flex items-center justify-center flex-shrink-0 text-white">
                    {question.user?.profile_picture_url ? (
                      <Image
                        src={question.user.profile_picture_url}
                        alt={getQuestionUserDisplayName(question.user)}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-medium text-xs">
                        {getQuestionUserInitials(question.user)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {getQuestionUserDisplayName(question.user)}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {formatQuestionTimeAgo(question.created_at)}
                      </span>

                      {question.is_pinned && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 rounded">
                          Fijada
                        </span>
                      )}
                      {question.is_resolved && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Resuelta
                        </span>
                      )}
                    </div>

                    <div
                      className="cursor-pointer"
                      onClick={() => toggleQuestionSelection(question.id)}
                    >
                      {question.title && (
                        <h4 className="text-gray-900 font-medium text-sm mb-1">
                          {question.title}
                        </h4>
                      )}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedQuestionId === question.id
                          ? question.content
                          : question.content.length > 150
                            ? `${question.content.substring(0, 150)}...`
                            : question.content}
                      </p>
                      {question.content.length > 150 &&
                        selectedQuestionId !== question.id && (
                          <button className="text-[#0A2540] text-xs mt-1 font-medium hover:underline">
                            Ver más
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        void handleReaction(question.id);
                      }}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        userReactions[question.id] === "like"
                          ? "text-red-500"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          userReactions[question.id] === "like"
                            ? "fill-current"
                            : ""
                        }`}
                      />
                      <span>
                        {reactionCounts[question.id] ?? question.reaction_count ?? 0}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleQuestionSelection(question.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0A2540] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{question.response_count}</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{question.view_count}</span>
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ x: 3 }}
                    onClick={() => toggleQuestionSelection(question.id)}
                    className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Ver conversación
                    <ChevronRight className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {selectedQuestionId === question.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <QuestionThread questionId={question.id} slug={slug} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  void loadMoreQuestions();
                }}
                disabled={loadingMore}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Cargar más</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateForm && (
          <CreateQuestionForm
            slug={slug}
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleQuestionCreated}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
