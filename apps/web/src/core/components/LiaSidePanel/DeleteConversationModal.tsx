'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LiaThemeColors, LiaConversationToDelete } from './types';
import styles from './LiaSidePanel.module.css';

interface DeleteConversationModalProps {
  themeColors: LiaThemeColors;
  conversationToDelete: LiaConversationToDelete;
  deletingConversationId: string | null;
  handleCancelDelete: () => void;
  handleConfirmDelete: () => void;
}

export function DeleteConversationModal({
  conversationToDelete,
  deletingConversationId,
  handleCancelDelete,
  handleConfirmDelete,
}: DeleteConversationModalProps) {
  const isDeleting = deletingConversationId === conversationToDelete.id;

  return (
    <motion.div
      className={styles.deleteBackdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleCancelDelete}
    >
      <motion.div
        className={styles.deleteModal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-conversation-title"
        aria-describedby="delete-conversation-description"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.deleteEyebrow}>Acción permanente</p>
        <h3 id="delete-conversation-title" className={styles.deleteTitle}>
          Eliminar conversación
        </h3>
        <p id="delete-conversation-description" className={styles.deleteText}>
          ¿Quieres eliminar “{conversationToDelete.title}” del historial?
        </p>
        <p className={styles.deleteWarning}>
          Esta acción no se puede deshacer.
        </p>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={handleCancelDelete}
            className={`${styles.secondaryButton} ${styles.modalButton}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className={`${styles.dangerButton} ${styles.modalButton}`}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
