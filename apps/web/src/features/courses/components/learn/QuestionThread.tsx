"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";

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
  } = useQuestionThread({
    questionId,
    slug,
  });

  if (loading) {
    return (
      <div className="p-6 border-t border-white/5 bg-white/[0.02]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-20 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="p-6 border-t border-gray-100 bg-gray-50"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-8 flex gap-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent/30 flex items-center justify-center text-white text-xs font-semibold shadow-inner flex-shrink-0">
          Tú
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={newResponse}
            onChange={(event) => setNewResponse(event.target.value)}
            placeholder="Escribe tu respuesta..."
            className="w-full bg-transparent border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary/40 dark:focus:border-accent/50 focus:ring-0 resize-none transition-colors min-h-[40px]"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-gray-400">
              {newResponse.length}/1000
            </span>
            <motion.button
              onClick={() => {
                void handleSubmitResponse();
              }}
              disabled={!newResponse.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Responder
            </motion.button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loadingResponses ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((item) => (
              <div key={item} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-sm">
              Aún no hay respuestas. Sé el primero en responder.
            </p>
          </div>
        ) : (
          responses.map((response) => (
            <QuestionResponseItem
              key={response.id}
              allowReply
              isSubmitting={isSubmitting}
              onReaction={(responseId) => {
                void handleResponseReaction(responseId);
              }}
              onReplyChange={setReplyContent}
              onReplyToggle={(responseId) =>
                setReplyingTo((currentReplyingTo) =>
                  currentReplyingTo === responseId ? null : responseId
                )
              }
              onSubmitReply={(parentId) => {
                void handleSubmitReply(parentId);
              }}
              replyContent={replyContent}
              replyingTo={replyingTo}
              response={response}
              responseReactionCounts={responseReactionCounts}
              responseReactions={responseReactions}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
