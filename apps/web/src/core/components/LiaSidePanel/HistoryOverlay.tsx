'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { LiaThemeColors, LiaConversationItem } from './types';
import styles from './LiaSidePanel.module.css';

interface HistoryOverlayProps {
  themeColors: LiaThemeColors;
  isHistoryLoading: boolean;
  historyList: LiaConversationItem[];
  closeHistory: () => void;
  editingConversationId: string | null;
  editingTitle: string;
  setEditingTitle: (v: string) => void;
  deletingConversationId: string | null;
  handleSelectConversation: (id: string) => void;
  handleStartEdit: (conv: LiaConversationItem, e: React.MouseEvent) => void;
  handleSaveEdit: (
    id: string,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  handleCancelEdit: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleDeleteClick: (conv: LiaConversationItem, e: React.MouseEvent) => void;
  currentPage: number;
  totalConversations: number;
  hasMore: boolean;
  handleNextPage: () => void;
  handlePrevPage: () => void;
}

export function HistoryOverlay({
  isHistoryLoading,
  historyList,
  closeHistory,
  editingConversationId,
  editingTitle,
  setEditingTitle,
  deletingConversationId,
  handleSelectConversation,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteClick,
  currentPage,
  totalConversations,
  hasMore,
  handleNextPage,
  handlePrevPage,
}: HistoryOverlayProps) {
  return (
    <motion.section
      className={styles.historyOverlay}
      aria-label="Historial de conversaciones"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.historyContent}>
        <div className={styles.historyIntro}>
          <h3 className={styles.historyTitle}>Historial</h3>
          <p className={styles.historySubtitle}>
            Retoma una conversación o administra tus sesiones recientes.
          </p>
        </div>

        {isHistoryLoading ? (
          <div className={styles.historyLoading}>
            <span className={styles.spinner} aria-hidden="true" />
            <span>Cargando conversaciones...</span>
          </div>
        ) : historyList.length === 0 ? (
          <div className={styles.historyEmpty}>
            <Clock3
              size={40}
              className={styles.historyEmptyIcon}
              aria-hidden="true"
            />
            <p>Aún no hay conversaciones guardadas.</p>
            <button
              type="button"
              onClick={closeHistory}
              className={styles.secondaryButton}
            >
              Volver al chat
            </button>
          </div>
        ) : (
          historyList.map((conversation) => {
            const isEditing =
              editingConversationId === conversation.conversation_id;
            const isDeleting =
              deletingConversationId === conversation.conversation_id;

            return (
              <motion.div
                key={conversation.conversation_id}
                className={styles.historyListItem}
                role="button"
                tabIndex={0}
                onClick={() =>
                  handleSelectConversation(conversation.conversation_id)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelectConversation(conversation.conversation_id);
                  }
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className={styles.historyItemHeader}>
                  {isEditing ? (
                    <div className={styles.editRow}>
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        autoFocus
                        className={styles.editInput}
                        aria-label="Título de la conversación"
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') {
                            handleSaveEdit(
                              conversation.conversation_id,
                              event,
                            );
                          }
                          if (event.key === 'Escape') {
                            handleCancelEdit(event);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.miniButton}
                        onClick={(event) =>
                          handleSaveEdit(
                            conversation.conversation_id,
                            event,
                          )
                        }
                        aria-label="Guardar título"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.miniButton}
                        onClick={handleCancelEdit}
                        aria-label="Cancelar edición"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={styles.historyItemTitle}>
                        {conversation.conversation_title ||
                          new Date(
                            conversation.started_at,
                          ).toLocaleDateString()}
                      </span>
                      <div className={styles.historyItemActions}>
                        <button
                          type="button"
                          className={styles.miniButton}
                          onClick={(event) =>
                            handleStartEdit(conversation, event)
                          }
                          aria-label="Editar título"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.miniButton} ${styles.miniButtonDanger}`}
                          onClick={(event) =>
                            handleDeleteClick(conversation, event)
                          }
                          disabled={isDeleting}
                          aria-label="Eliminar conversación"
                        >
                          {isDeleting ? (
                            <span className={styles.spinner} />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                        <span className={styles.historyTime}>
                          {new Date(
                            conversation.started_at,
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.historyItemMeta}>
                  <span>
                    {conversation.total_messages || 'Varios'} mensajes
                  </span>
                </div>
              </motion.div>
            );
          })
        )}

        {historyList.length > 0 && (
          <div className={styles.pagination}>
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isHistoryLoading}
              className={styles.paginationButton}
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <span className={styles.pageIndicator}>
              {currentPage + 1}
              {totalConversations > 0 && ` / ${totalConversations}`}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasMore || isHistoryLoading}
              className={styles.paginationButton}
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}
