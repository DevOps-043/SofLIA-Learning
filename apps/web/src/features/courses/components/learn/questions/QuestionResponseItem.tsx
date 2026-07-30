"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Send } from "lucide-react";

import styles from "../CommunityExperience.module.css";
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
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.response}
    >
      <span className={styles.avatar}>
        {response.user?.profile_picture_url ? (
          <Image
            src={response.user.profile_picture_url}
            alt={getQuestionUserDisplayName(response.user)}
            fill
            sizes="38px"
            className="object-cover"
          />
        ) : (
          getQuestionUserInitials(response.user)
        )}
      </span>

      <div className={styles.responseBody}>
        <div className={styles.metaRow}>
          <span className={styles.author}>
            {getQuestionUserDisplayName(response.user)}
          </span>
          <span className={styles.timestamp}>
            {formatQuestionTimeAgo(response.created_at)}
          </span>
          {response.is_instructor_answer && (
            <span className={styles.instructorBadge}>Instructor</span>
          )}
        </div>

        <p className={styles.responseContent}>{response.content}</p>

        <div className={styles.responseActions}>
          <button
            onClick={() => onReaction(response.id)}
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
            {responseReactionCounts[response.id] ??
              response.reaction_count ??
              0}
          </button>

          {allowReply && (
            <button
              onClick={() => onReplyToggle(response.id)}
              className={styles.replyButton}
              type="button"
            >
              {isReplying ? "Cancelar" : "Responder"}
            </button>
          )}
        </div>

        {allowReply && (
          <AnimatePresence initial={false}>
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.inlineReply}
              >
                <div className={styles.inlineReplyField}>
                  <textarea
                    value={replyContent}
                    onChange={(event) => onReplyChange(event.target.value)}
                    placeholder="Escribe una respuesta…"
                    rows={1}
                  />
                  <button
                    onClick={() => onSubmitReply(response.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className={styles.iconButton}
                    aria-label="Enviar respuesta"
                    type="button"
                  >
                    <Send aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {response.replies && response.replies.length > 0 && (
          <div className={styles.nestedResponses}>
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
    </motion.article>
  );
}
