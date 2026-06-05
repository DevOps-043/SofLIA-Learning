"use client";

import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";

import { QuestionResponseItem } from "./questions/QuestionResponseItem";
import { useQuestionThread } from "./questions/useQuestionThread";

type QuestionThreadProps = {
  questionId: string;
  slug: string;
};

export function QuestionThread({ questionId, slug }: QuestionThreadProps) {
  const {
    handleResponseReaction,
    handleSubmitReply,
    handleSubmitResponse,
    isSubmitting,
    loading,
    loadingResponses,
    newResponse,
    question,
    replyContent,
    replyingTo,
    responseReactionCounts,
    responseReactions,
    responses,
    setNewResponse,
    setReplyContent,
    setReplyingTo,
    textareaRef,
  } = useQuestionThread({ questionId, slug });

  if (loading) {
    return (
      <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-5">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
            </div>
          </div>
          <div className="h-16 bg-gray-200 dark:bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-t border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Reply composer */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
            Tú
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={1}
              className="w-full bg-transparent border-0 border-b border-gray-200 dark:border-white/10 px-0 py-1.5 text-sm text-gray-800 dark:text-white/85 placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-primary/50 dark:focus:border-accent/50 focus:ring-0 resize-none transition-colors"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-gray-400 dark:text-white/25 tabular-nums">
                {newResponse.length}/1000
              </span>
              <motion.button
                onClick={() => void handleSubmitResponse()}
                disabled={!newResponse.trim() || isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary/10 hover:bg-primary/15 text-primary dark:bg-accent/15 dark:hover:bg-accent/25 dark:text-accent border border-primary/15 dark:border-accent/20"
              >
                {isSubmitting ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Responder
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Responses */}
      <div className="px-5 py-4">
        {loadingResponses ? (
          <div className="space-y-5 animate-pulse">
            {[1, 2].map((item) => (
              <div key={item} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-28" />
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-gray-400 dark:text-white/25" />
            </div>
            <p className="text-sm text-gray-400 dark:text-white/35 text-center">
              Aún no hay respuestas. Sé el primero en responder.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {responses.map((response) => (
              <QuestionResponseItem
                key={response.id}
                allowReply
                isSubmitting={isSubmitting}
                onReaction={(responseId) => void handleResponseReaction(responseId)}
                onReplyChange={setReplyContent}
                onReplyToggle={(responseId) =>
                  setReplyingTo((cur) => (cur === responseId ? null : responseId))
                }
                onSubmitReply={(parentId) => void handleSubmitReply(parentId)}
                replyContent={replyContent}
                replyingTo={replyingTo}
                response={response}
                responseReactionCounts={responseReactionCounts}
                responseReactions={responseReactions}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
