"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Send } from "lucide-react";

import type { CourseQuestionResponse } from "./types";
import {
  formatQuestionTimeAgo,
  getQuestionUserDisplayName,
  getQuestionUserInitials,
} from "./utils";

type QuestionResponseItemProps = {
  allowReply: boolean;
  isSubmitting: boolean;
  onReaction: (responseId: string) => void;
  onReplyChange: (value: string) => void;
  onReplyToggle: (responseId: string) => void;
  onSubmitReply: (parentId: string) => void;
  replyContent: string;
  replyingTo: string | null;
  response: CourseQuestionResponse;
  responseReactionCounts: Record<string, number>;
  responseReactions: Record<string, string>;
};

export function QuestionResponseItem({
  allowReply,
  isSubmitting,
  onReaction,
  onReplyChange,
  onReplyToggle,
  onSubmitReply,
  replyContent,
  replyingTo,
  response,
  responseReactionCounts,
  responseReactions,
}: QuestionResponseItemProps) {
  const isReplying = replyingTo === response.id;
  const isLiked = responseReactions[response.id] === "like";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-3"
    >
      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
        {response.user?.profile_picture_url ? (
          <Image
            src={response.user.profile_picture_url}
            alt={getQuestionUserDisplayName(response.user)}
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : (
          <span className="text-gray-500 dark:text-white/50 text-xs font-semibold">
            {getQuestionUserInitials(response.user)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
            {getQuestionUserDisplayName(response.user)}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-white/30">•</span>
          <span className="text-xs text-gray-400 dark:text-white/35">
            {formatQuestionTimeAgo(response.created_at)}
          </span>
          {response.is_instructor_answer && (
            <span className="px-2 py-0.5 bg-accent/15 text-accent dark:bg-accent/20 dark:text-accent text-[10px] font-semibold rounded-full border border-accent/25">
              Instructor
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-white/75 text-sm leading-relaxed whitespace-pre-wrap mb-2">
          {response.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onReaction(response.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              isLiked
                ? "text-red-500"
                : "text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
            <span>{responseReactionCounts[response.id] ?? response.reaction_count ?? 0}</span>
          </button>

          {allowReply && (
            <button
              onClick={() => onReplyToggle(response.id)}
              className="text-xs text-gray-400 dark:text-white/30 hover:text-primary dark:hover:text-accent transition-colors font-medium"
            >
              Responder
            </button>
          )}
        </div>

        {/* Inline reply form */}
        {allowReply && (
          <AnimatePresence>
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pl-4 border-l-2 border-primary/20 dark:border-accent/20"
              >
                <div className="flex gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => onReplyChange(e.target.value)}
                    placeholder="Escribe una respuesta..."
                    rows={1}
                    className="flex-1 bg-transparent border-0 border-b border-gray-200 dark:border-white/10 px-0 py-1 text-sm text-gray-800 dark:text-white/85 placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-primary/40 dark:focus:border-accent/40 focus:ring-0 resize-none transition-colors"
                  />
                  <button
                    onClick={() => onSubmitReply(response.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 dark:bg-accent/15 dark:hover:bg-accent/25 text-primary dark:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Nested replies */}
        {response.replies && response.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l border-gray-100 dark:border-white/8">
            {response.replies.map((reply) => (
              <QuestionResponseItem
                key={reply.id}
                allowReply={false}
                isSubmitting={isSubmitting}
                onReaction={onReaction}
                onReplyChange={onReplyChange}
                onReplyToggle={onReplyToggle}
                onSubmitReply={onSubmitReply}
                replyContent={replyContent}
                replyingTo={replyingTo}
                response={reply}
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
