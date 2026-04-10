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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="flex gap-4">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 text-white">
          {response.user?.profile_picture_url ? (
            <Image
              src={response.user.profile_picture_url}
              alt={getQuestionUserDisplayName(response.user)}
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-gray-500 text-xs font-medium">
              {getQuestionUserInitials(response.user)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-gray-900">
              {getQuestionUserDisplayName(response.user)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">
              {formatQuestionTimeAgo(response.created_at)}
            </span>
            {response.is_instructor_answer && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#0A2540]/10 text-[#0A2540] dark:bg-[#00D4B3]/20 dark:text-[#00D4B3] text-[10px] font-medium rounded">
                Instructor
              </span>
            )}
          </div>

          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-2">
            {response.content}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onReaction(response.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                responseReactions[response.id] === "like"
                  ? "text-red-500"
                  : "text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  responseReactions[response.id] === "like" ? "fill-current" : ""
                }`}
              />
              <span>
                {responseReactionCounts[response.id] ?? response.reaction_count ?? 0}
              </span>
            </button>

            {allowReply && (
              <button
                onClick={() => onReplyToggle(response.id)}
                className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
              >
                Responder
              </button>
            )}
          </div>

          {allowReply && (
            <AnimatePresence>
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pl-4 border-l border-gray-200"
                >
                  <div className="flex gap-3">
                    <textarea
                      value={replyContent}
                      onChange={(event) => onReplyChange(event.target.value)}
                      placeholder="Escribe una respuesta..."
                      className="flex-1 bg-transparent border-0 border-b border-gray-200 px-0 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A2540]/40 dark:focus:border-[#00D4B3]/50 focus:ring-0 resize-none min-h-[32px]"
                      rows={1}
                    />
                    <button
                      onClick={() => onSubmitReply(response.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {response.replies && response.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l border-gray-100">
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
      </div>
    </motion.div>
  );
}
