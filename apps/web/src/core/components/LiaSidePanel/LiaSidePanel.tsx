'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare, Lightbulb, HelpCircle, Trash2, Clock, Edit2, Check, MoreVertical, Settings, Mic, MicOff, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SofLIAPersonalizationSettings } from '../../../features/lia/components/SofLIAPersonalizationSettings';
import { useLiaSidePanelLogic } from './hooks/useLiaSidePanelLogic';

const PANEL_WIDTH = 420; // Mismo ancho que ARIA en IRIS

// Exportar constante para uso en ContentWrapper
export const LIA_PANEL_WIDTH = PANEL_WIDTH;

// Función para parsear Markdown completo y convertirlo a elementos React
function parseMarkdownContent(text: string, onLinkClick: (url: string) => void, isDarkMode: boolean = false): React.ReactNode {
  let keyIndex = 0;

  // Primero convertir listas con asterisco a guiones
  let processedText = text.replace(/^\*\s+/gm, '- ');

  // Dividir por líneas para procesar cada una
  const lines = processedText.split('\n');

  // Color del enlace basado en el tema
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // Regex combinado para encontrar negritas, cursivas y enlaces
    // Orden: enlaces primero, luego negritas, luego cursivas
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;

    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(line)) !== null) {
      // Texto antes del match
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // Es un enlace [texto](url)
        const linkText = match[2];
        const linkUrl = match[3];
        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            onClick={(e) => {
              e.preventDefault();
              onLinkClick(linkUrl);
            }}
            style={{
              color: linkColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {linkText}
          </a>
        );
      } else if (match[4]) {
        // Es negrita **texto**
        elements.push(
          <strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>
            {match[5]}
          </strong>
        );
      } else if (match[6]) {
        // Es cursiva *texto*
        elements.push(
          <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {match[7]}
          </em>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Texto después del último match
    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }

    return elements.length > 0 ? elements : [line];
  };

  // Procesar cada línea y agregar saltos de línea
  const result: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />);
    }
  });

  return <>{result}</>;
}

function LiaSidePanelContent() {
  const {
    t, user, isOpen, closePanel,
    isDarkMode, isLightTheme, themeColors,
    messages, isLoading, clearHistory, currentConversationId,
    inputValue, setInputValue, inputRef, messagesEndRef, chatContainerRef,
    handleChatScroll, handleSendMessage, handleQuickAction, handleKeyDown, handleLinkClick, quickActions,
    currentTip, tips,
    isSpeaking, isVoiceEnabled,
    isDictationEnabled, isDictating, isProcessingDictation, interimTranscript, finalTranscript, toggleDictation, stopDictation,
    isOptionsMenuOpen, setIsOptionsMenuOpen, optionsMenuRef,
    isPersonalizationOpen, setIsPersonalizationOpen,
    isAvatarExpanded, setIsAvatarExpanded,
    showHistory, setShowHistory, closeHistory, historyList, isHistoryLoading,
    editingConversationId, editingTitle, setEditingTitle, deletingConversationId, showDeleteConfirm, conversationToDelete,
    currentPage, totalConversations, hasMore,
    handleNextPage, handlePrevPage, handleSelectConversation, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDeleteClick, handleConfirmDelete, handleCancelDelete,
  } = useLiaSidePanelLogic();

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100%',
            maxWidth: `${PANEL_WIDTH}px`,
            height: '100vh',
            backgroundColor: themeColors.panelBg,
            borderLeft: `1px solid ${themeColors.borderColor}`,
            borderBottomLeftRadius: '30px',
            overflow: 'hidden',
            zIndex: 130,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isLightTheme ? '-4px 0 24px rgba(0, 0, 0, 0.08)' : '-4px 0 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header del panel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${themeColors.borderColor}`,
              backgroundColor: themeColors.headerBg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar de LIA */}
              <div style={{ position: 'relative' }}>
                <motion.img
                  layoutId="lia-avatar-header"
                  src="/lia-avatar.png"
                  alt="SofLIA"
                  onClick={() => setIsAvatarExpanded(true)}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${themeColors.accentColor}`,
                    cursor: 'zoom-in'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#22c55e',
                    borderRadius: '50%',
                    border: `2px solid ${themeColors.panelBg}`,
                  }}
                />
              </div>

              <div>
                <h2 style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  {t('lia.header.title')}
                </h2>
                <p style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}>
                  {t('lia.header.subtitle')}
                </p>
              </div>
            </div>

            {/* Contenedor de acciones (Menú de opciones + Cerrar) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Botón de historial (mantener visible) */}
              <button
                onClick={() => {
                  if (showHistory) {
                    closeHistory();
                  } else {
                    setShowHistory(true);
                  }
                }}
                title={showHistory ? "Volver al chat" : "Historial"}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent'}
              >
                <Clock style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
              </button>

              {/* Menú de opciones (3 puntos) */}
              <div ref={optionsMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                  title="Opciones"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isOptionsMenuOpen ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOptionsMenuOpen) {
                      e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOptionsMenuOpen) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <MoreVertical style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
                </button>

                {/* Menú desplegable */}
                {isOptionsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '8px',
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#1E2329',
                      border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: '12px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      overflow: 'hidden',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      zIndex: 100000,
                      minWidth: '200px',
                    }}
                  >
                    <div style={{ padding: '8px 0' }}>
                      {/* Opción: Personalización */}
                      <button
                        onClick={() => {
                          setIsPersonalizationOpen(true);
                          setIsOptionsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          color: isLightTheme ? '#0A2540' : '#FFFFFF',
                          fontSize: '14px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Settings style={{ width: '16px', height: '16px' }} color={isLightTheme ? '#6C757D' : '#9CA3AF'} />
                        <span>Personalización</span>
                      </button>

                      {/* Opción: Borrar chat */}
                      <button
                        onClick={() => {
                          clearHistory();
                          setIsOptionsMenuOpen(false);
                        }}
                        disabled={messages.length === 0}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: messages.length > 0 ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          color: isLightTheme ? '#ef4444' : '#f87171',
                          fontSize: '14px',
                          opacity: messages.length > 0 ? 1 : 0.5,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (messages.length > 0) {
                            e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} color={isLightTheme ? '#ef4444' : '#f87171'} />
                        <span>{t('lia.chat.cleanHistory')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={closePanel}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: 0,
            }}
          >
            {messages.length === 0 ? (
               // Empty State / Loading Screen Style
               <div
                 style={{
                   flex: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center',
                   textAlign: 'center',
                   opacity: 0.8,
                   padding: '0 20px'
                 }}
               >
                 <motion.div
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ duration: 0.5 }}
                   style={{ marginBottom: '24px', position: 'relative' }}
                 >
                   {/* Glow effect behind avatar */}
                   <div style={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: 'translate(-50%, -50%)',
                     width: '120px',
                     height: '120px',
                     borderRadius: '50%',
                     backgroundColor: themeColors.accentColor,
                     filter: 'blur(40px)',
                     opacity: 0.2,
                     zIndex: 0
                   }} />

                   <img
                    src="/lia-avatar.png"
                    alt="SofLIA"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `3px solid ${themeColors.accentColor}`,
                      boxShadow: `0 0 20px ${themeColors.accentColor}40`,
                      position: 'relative',
                      zIndex: 1
                    }}
                   />
                 </motion.div>

                 <motion.div
                   key={currentTip} // Animate when tip changes
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.2, duration: 0.5 }}
                 >
                   <h3 style={{
                     color: themeColors.textPrimary,
                     fontSize: '18px',
                     fontWeight: 600,
                     marginBottom: '8px'
                   }}>
                     SofLIA
                   </h3>
                   <p style={{
                     color: themeColors.textSecondary,
                     fontSize: '14px',
                     lineHeight: 1.5,
                     maxWidth: '280px',
                     margin: '0 auto'
                   }}>
                     {currentTip}
                   </p>
                 </motion.div>
               </div>
            ) : (
              // Chat Messages
              messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: message.role === 'user' ? themeColors.messageBubbleUser : themeColors.messageBubbleAssistant,
                    color: message.role === 'user' ? 'white' : themeColors.textPrimary,
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  <p style={{
                    fontSize: '14px',
                    lineHeight: 1.5,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}>
                    {message.role === 'assistant'
                      ? parseMarkdownContent(message.content, handleLinkClick, isDarkMode)
                      : message.content
                    }
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      marginTop: '6px',
                      marginBottom: 0,
                      color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary,
                    }}
                  >
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
            )}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: themeColors.messageBubbleAssistant,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite 0.2s' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite 0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div style={{ padding: '0 20px 12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: themeColors.inputBg,
                        border: `1px solid ${themeColors.borderColor}`,
                        color: themeColors.textPrimary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#2d3a47';
                        e.currentTarget.style.borderColor = themeColors.accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.inputBg;
                        e.currentTarget.style.borderColor = themeColors.borderColor;
                      }}
                    >
                      <Icon style={{ width: '14px', height: '14px' }} color={themeColors.accentColor} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${themeColors.borderColor}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: themeColors.inputBg,
                borderRadius: '24px',
                padding: '10px 16px',
                border: `1px solid ${themeColors.inputBorder}`,
              }}
            >


              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue + (isDictating ? (inputValue ? ' ' : '') + finalTranscript + (finalTranscript && interimTranscript ? ' ' : '') + interimTranscript : '')}
                  onChange={(e) => {
                    // Solo permitir edición si no está dictando
                    if (!isDictating) {
                      setInputValue(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Si está dictando, detener primero
                      if (isDictating) {
                        // Detener dictado (aplicará el texto automáticamente)
                        stopDictation();
                      }
                      handleSendMessage();
                    }
                  }}
                  placeholder={isDictating ? 'Escuchando...' : t('lia.chat.inputPlaceholder')}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: themeColors.textPrimary,
                    fontSize: '14px',
                  }}
                />
                {/* Indicador visual de texto temporal (debajo del input) */}
                {isDictating && interimTranscript && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-18px',
                      left: 0,
                      fontSize: '11px',
                      color: themeColors.accentColor,
                      fontStyle: 'italic',
                      pointerEvents: 'none',
                      opacity: 0.7,
                    }}
                  >
                    {interimTranscript}
                  </div>
                )}
              </div>

              {/* 🎙️ Botón de dictado (solo si está habilitado) */}
              {isDictationEnabled && (
                <button
                  onClick={toggleDictation}
                  disabled={isProcessingDictation}
                  title={isDictating ? 'Detener dictado' : 'Iniciar dictado'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isDictating
                      ? '#EF4444'
                      : isProcessingDictation
                        ? (isLightTheme ? '#CBD5E1' : '#374151')
                        : 'transparent',
                    border: `1px solid ${isDictating ? '#EF4444' : themeColors.inputBorder}`,
                    cursor: isProcessingDictation ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: isProcessingDictation ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingDictation && !isDictating) {
                      e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDictating) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {isProcessingDictation ? (
                    <Loader2 style={{ width: '16px', height: '16px', color: themeColors.textSecondary }} className="animate-spin" />
                  ) : isDictating ? (
                    <MicOff style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                  ) : (
                    <Mic style={{ width: '16px', height: '16px', color: themeColors.textSecondary }} />
                  )}
                </button>
              )}

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: inputValue.trim() && !isLoading ? themeColors.accentColor : (isLightTheme ? '#CBD5E1' : '#374151'),
                  border: 'none',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <Send style={{
                  width: '16px',
                  height: '16px',
                  color: inputValue.trim() && !isLoading ? '#FFFFFF' : (isLightTheme ? '#6B7280' : '#9CA3AF')
                }} />
              </button>
            </div>
          </div>

          {/* History View Overlay */}
          <AnimatePresence>
            {showHistory && (
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
                  overflow: 'hidden'
                }}
              >
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{marginBottom: '8px'}}>
                      <h3 style={{color: themeColors.textPrimary, margin: 0, fontSize: '18px', fontWeight: 600}}>Historial</h3>
                      <p style={{color: themeColors.textSecondary, fontSize:'13px', margin:'4px 0 0'}}>Tus conversaciones recientes</p>
                    </div>

                    {isHistoryLoading ? (
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', color: themeColors.textSecondary}}>
                           <div style={{width:'20px', height:'20px', border:`2px solid ${themeColors.accentColor}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', marginRight:'10px'}}></div>
                           <span>Cargando...</span>
                        </div>
                    ) : historyList.length === 0 ? (
                        <div style={{textAlign:'center', padding:'60px 20px', color: themeColors.textSecondary}}>
                           <Clock size={48} style={{opacity:0.2, margin:'0 auto 16px', display:'block'}} />
                           <p>No hay conversaciones guardadas.</p>
                           <button onClick={closeHistory} style={{marginTop:'12px', background:'transparent', border:`1px solid ${themeColors.borderColor}`, padding:'8px 16px', borderRadius:'8px', color: themeColors.textPrimary, cursor:'pointer'}}>Volver al chat</button>
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
                            onMouseEnter={e => {
                               e.currentTarget.style.borderColor = themeColors.accentColor;
                               e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                               e.currentTarget.style.borderColor = themeColors.borderColor;
                               e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', alignItems: 'center'}}>
                                {editingConversationId === conv.conversation_id ? (
                                    <div style={{display:'flex', flex:1, gap:'8px', alignItems:'center'}}>
                                        <input
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(conv.conversation_id, e as any);
                                                if (e.key === 'Escape') handleCancelEdit(e as any);
                                            }}
                                            style={{
                                                flex: 1,
                                                background: themeColors.inputBg,
                                                border: `1px solid ${themeColors.accentColor}`,
                                                color: themeColors.textPrimary,
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <button onClick={(e) => handleSaveEdit(conv.conversation_id, e)} style={{background:'none', border:'none', cursor:'pointer', color: themeColors.accentColor, padding: 0}}>
                                            <Check size={16} />
                                        </button>
                                        <button onClick={handleCancelEdit} style={{background:'none', border:'none', cursor:'pointer', color: themeColors.textSecondary, padding: 0}}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{fontWeight:600, color: themeColors.textPrimary, fontSize:'14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px'}}>
                                           {conv.conversation_title || new Date(conv.started_at).toLocaleDateString()}
                                        </span>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                            <button
                                                onClick={(e) => handleStartEdit(conv, e)}
                                                style={{background:'none', border:'none', cursor:'pointer', color: themeColors.textSecondary, padding: 0, opacity: 0.6}}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                                title="Editar título"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(conv, e)}
                                                disabled={deletingConversationId === conv.conversation_id}
                                                style={{
                                                    background:'none',
                                                    border:'none',
                                                    cursor: deletingConversationId === conv.conversation_id ? 'wait' : 'pointer',
                                                    color: deletingConversationId === conv.conversation_id ? themeColors.textSecondary : '#ef4444',
                                                    padding: 0,
                                                    opacity: deletingConversationId === conv.conversation_id ? 0.5 : 0.6,
                                                    display: 'flex',
                                                    alignItems: 'center'
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
                                                    <div style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        border: `2px solid ${themeColors.textSecondary}`,
                                                        borderTopColor: 'transparent',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite'
                                                    }}></div>
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                            <span style={{fontSize:'12px', color: themeColors.textSecondary}}>
                                               {new Date(conv.started_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </>
                                )}
                             </div>
                             <div style={{fontSize:'12px', color: themeColors.textSecondary, display:'flex', gap:'8px'}}>
                                <span>{conv.total_messages || 'Varios'} mensajes</span>
                             </div>
                          </div>
                        ))
                    )}

                    {/* Controles de Paginación */}
                    {historyList.length > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        borderTop: `1px solid ${themeColors.borderColor}`,
                        marginTop: '12px'
                      }}>
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
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage > 0) {
                              e.currentTarget.style.borderColor = themeColors.accentColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = themeColors.borderColor;
                          }}
                        >
                          <ChevronLeft size={16} />
                          Anterior
                        </button>

                        <span style={{
                          color: themeColors.textSecondary,
                          fontSize: '13px'
                        }}>
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
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (hasMore) {
                              e.currentTarget.style.borderColor = themeColors.accentColor;
                            }
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
            )}
          </AnimatePresence>

          {/* Modal de Confirmación de Eliminación */}
          <AnimatePresence>
            {showDeleteConfirm && conversationToDelete && (
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
                  padding: '20px'
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
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      color: themeColors.textPrimary,
                      fontSize: '20px',
                      fontWeight: 600,
                      margin: '0 0 8px 0'
                    }}>
                      Eliminar conversación
                    </h3>
                    <p style={{
                      color: themeColors.textSecondary,
                      fontSize: '14px',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      ¿Estás seguro de que quieres eliminar la conversación "{conversationToDelete.title}"?
                    </p>
                    <p style={{
                      color: '#ef4444',
                      fontSize: '13px',
                      margin: '8px 0 0 0',
                      fontWeight: 500
                    }}>
                      Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
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
                        transition: 'all 0.2s'
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
                      disabled={deletingConversationId === conversationToDelete.id}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: deletingConversationId === conversationToDelete.id
                          ? themeColors.textSecondary
                          : '#ef4444',
                        color: 'white',
                        cursor: deletingConversationId === conversationToDelete.id ? 'wait' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        opacity: deletingConversationId === conversationToDelete.id ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (deletingConversationId !== conversationToDelete.id) {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (deletingConversationId !== conversationToDelete.id) {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                        }
                      }}
                    >
                      {deletingConversationId === conversationToDelete.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes liaPulse {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
          {/* Expanded Avatar Overlay (Easter Egg) */}
          <AnimatePresence>
            {isAvatarExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAvatarExpanded(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'zoom-out',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'relative' }}
                >
                    <motion.img
                      layoutId="lia-avatar-header"
                      src="/lia-avatar.png"
                      alt="SofLIA Expanded"
                      style={{
                        width: 'min(80vw, 400px)',
                        height: 'min(80vw, 400px)',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `4px solid ${themeColors.accentColor}`,
                        boxShadow: `0 0 50px ${themeColors.accentColor}80`
                      }}
                    />
                    <div style={{
                      marginTop: '20px',
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>SofLIA</h3>
                      <p style={{ opacity: 0.8, margin: 0 }}>Learning Intelligence Assistant</p>
                    </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.aside>
        )}
      </AnimatePresence>
      {/* Modal de Personalización */}
      {isPersonalizationOpen && (
        <SofLIAPersonalizationSettings
          isOpen={isPersonalizationOpen}
          onClose={() => setIsPersonalizationOpen(false)}
        />
      )}
    </>
  );
}

export function LiaSidePanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<LiaSidePanelContent />, document.body);
}
