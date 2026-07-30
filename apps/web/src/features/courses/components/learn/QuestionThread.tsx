"use client";

import { motion } from "framer-motion";
import { LoaderCircle, MessageCircleMore, Send } from "lucide-react";

import styles from "./CommunityExperience.module.css";
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
      <div className={styles.threadLoading} aria-label="Cargando conversación">
        <div className={styles.skeletonLine} style={{ width: "42%" }} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} style={{ width: "68%" }} />
      </div>
    );
  }

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={styles.thread}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.composer}>
        <span className={styles.composerAvatar} aria-hidden="true">
          Tú
        </span>
        <div className={styles.composerField}>
          <textarea
            ref={textareaRef}
            value={newResponse}
            onChange={(event) => setNewResponse(event.target.value)}
            placeholder="Comparte una respuesta útil…"
            rows={1}
            className={styles.composerInput}
            maxLength={1000}
          />
          <div className={styles.composerFooter}>
            <span className={styles.characterCount}>
              {newResponse.length}/1000
            </span>
            <button
              onClick={() => void handleSubmitResponse()}
              disabled={!newResponse.trim() || isSubmitting}
              className={styles.sendButton}
              type="button"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
              Responder
            </button>
          </div>
        </div>
      </div>

      {loadingResponses ? (
        <div className={styles.responsesLoading}>
          {[72, 54].map((width) => (
            <div
              className={styles.skeletonLine}
              style={{ width: `${width}%` }}
              key={width}
            />
          ))}
        </div>
      ) : responses.length === 0 ? (
        <div className={styles.noResponses}>
          <MessageCircleMore aria-hidden="true" />
          <p>Aún no hay respuestas. Sé la primera persona en participar.</p>
        </div>
      ) : (
        <div className={styles.responses}>
          {responses.map((response) => (
            <QuestionResponseItem
              key={response.id}
              allowReply
              isSubmitting={isSubmitting}
              onReaction={(responseId) =>
                void handleResponseReaction(responseId)
              }
              onReplyChange={setReplyContent}
              onReplyToggle={(responseId) =>
                setReplyingTo((current) =>
                  current === responseId ? null : responseId,
                )
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
    </motion.div>
  );
}
