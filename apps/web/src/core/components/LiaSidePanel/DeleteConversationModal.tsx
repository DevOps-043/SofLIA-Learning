'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LiaThemeColors, LiaConversationToDelete } from './types';

interface DeleteConversationModalProps {
  themeColors: LiaThemeColors;
  conversationToDelete: LiaConversationToDelete;
  deletingConversationId: string | null;
  handleCancelDelete: () => void;
  handleConfirmDelete: () => void;
}

export function DeleteConversationModal({
  themeColors,
  conversationToDelete,
  deletingConversationId,
  handleCancelDelete,
  handleConfirmDelete,
}: DeleteConversationModalProps) {
  const isDeleting = deletingConversationId === conversationToDelete.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleCancelDelete}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themeColors.panelBg,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          border: `1px solid ${themeColors.borderColor}`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: themeColors.textPrimary, fontSize: '20px', fontWeight: 600, margin: '0 0 8px 0' }}>
            Eliminar conversación
          </h3>
          <p style={{ color: themeColors.textSecondary, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            ¿Estás seguro de que quieres eliminar la conversación "{conversationToDelete.title}"?
          </p>
          <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0 0', fontWeight: 500 }}>
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancelDelete}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${themeColors.borderColor}`,
              background: 'transparent',
              color: themeColors.textPrimary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.inputBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: isDeleting ? themeColors.textSecondary : '#ef4444',
              color: 'white',
              cursor: isDeleting ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: isDeleting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = '#ef4444';
            }}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
