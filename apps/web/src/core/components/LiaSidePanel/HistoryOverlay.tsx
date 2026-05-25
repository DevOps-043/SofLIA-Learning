'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Edit2, Check, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { LiaThemeColors, LiaConversationItem } from './types';

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
  handleSaveEdit: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  handleCancelEdit: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleDeleteClick: (conv: LiaConversationItem, e: React.MouseEvent) => void;
  currentPage: number;
  totalConversations: number;
  hasMore: boolean;
  handleNextPage: () => void;
  handlePrevPage: () => void;
}

export function HistoryOverlay({
  themeColors,
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'absolute',
        top: '81px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: themeColors.panelBg,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <h3 style={{ color: themeColors.textPrimary, margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Historial
          </h3>
          <p style={{ color: themeColors.textSecondary, fontSize: '13px', margin: '4px 0 0' }}>
            Tus conversaciones recientes
          </p>
        </div>

        {isHistoryLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: themeColors.textSecondary,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${themeColors.accentColor}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '10px',
              }}
            />
            <span>Cargando...</span>
          </div>
        ) : historyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: themeColors.textSecondary }}>
            <Clock size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
            <p>No hay conversaciones guardadas.</p>
            <button
              onClick={closeHistory}
              style={{
                marginTop: '12px',
                background: 'transparent',
                border: `1px solid ${themeColors.borderColor}`,
                padding: '8px 16px',
                borderRadius: '8px',
                color: themeColors.textPrimary,
                cursor: 'pointer',
              }}
            >
              Volver al chat
            </button>
          </div>
        ) : (
          historyList.map((conv) => (
            <div
              key={conv.conversation_id}
              onClick={() => handleSelectConversation(conv.conversation_id)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: themeColors.inputBg,
                border: `1px solid ${themeColors.borderColor}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = themeColors.accentColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = themeColors.borderColor;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                {editingConversationId === conv.conversation_id ? (
                  <div style={{ display: 'flex', flex: 1, gap: '8px', alignItems: 'center' }}>
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(conv.conversation_id, e);
                        if (e.key === 'Escape') handleCancelEdit(e);
                      }}
                      style={{
                        flex: 1,
                        background: themeColors.inputBg,
                        border: `1px solid ${themeColors.accentColor}`,
                        color: themeColors.textPrimary,
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      onClick={(e) => handleSaveEdit(conv.conversation_id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColors.accentColor, padding: 0 }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={(e) => handleCancelEdit(e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColors.textSecondary, padding: 0 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      style={{
                        fontWeight: 600,
                        color: themeColors.textPrimary,
                        fontSize: '14px',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: '8px',
                      }}
                    >
                      {conv.conversation_title || new Date(conv.started_at).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => handleStartEdit(conv, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColors.textSecondary, padding: 0, opacity: 0.6 }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                        title="Editar título"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(conv, e)}
                        disabled={deletingConversationId === conv.conversation_id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: deletingConversationId === conv.conversation_id ? 'wait' : 'pointer',
                          color: deletingConversationId === conv.conversation_id ? themeColors.textSecondary : 'var(--color-error)',
                          padding: 0,
                          opacity: deletingConversationId === conv.conversation_id ? 0.5 : 0.6,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          if (deletingConversationId !== conv.conversation_id) {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deletingConversationId !== conv.conversation_id) {
                            e.currentTarget.style.opacity = '0.6';
                          }
                        }}
                        title="Eliminar conversación"
                      >
                        {deletingConversationId === conv.conversation_id ? (
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              border: `2px solid ${themeColors.textSecondary}`,
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                            }}
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                      <span style={{ fontSize: '12px', color: themeColors.textSecondary }}>
                        {new Date(conv.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div style={{ fontSize: '12px', color: themeColors.textSecondary, display: 'flex', gap: '8px' }}>
                <span>{conv.total_messages || 'Varios'} mensajes</span>
              </div>
            </div>
          ))
        )}

        {/* Paginación */}
        {historyList.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderTop: `1px solid ${themeColors.borderColor}`,
              marginTop: '12px',
            }}
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isHistoryLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: currentPage === 0 ? 'transparent' : themeColors.inputBg,
                border: `1px solid ${themeColors.borderColor}`,
                borderRadius: '8px',
                color: currentPage === 0 ? themeColors.textSecondary : themeColors.textPrimary,
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 0 ? 0.5 : 1,
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentPage > 0) e.currentTarget.style.borderColor = themeColors.accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = themeColors.borderColor;
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <span style={{ color: themeColors.textSecondary, fontSize: '13px' }}>
              Página {currentPage + 1} {totalConversations > 0 && `(${totalConversations} total)`}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!hasMore || isHistoryLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: !hasMore ? 'transparent' : themeColors.inputBg,
                border: `1px solid ${themeColors.borderColor}`,
                borderRadius: '8px',
                color: !hasMore ? themeColors.textSecondary : themeColors.textPrimary,
                cursor: !hasMore ? 'not-allowed' : 'pointer',
                opacity: !hasMore ? 0.5 : 1,
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (hasMore) e.currentTarget.style.borderColor = themeColors.accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = themeColors.borderColor;
              }}
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
