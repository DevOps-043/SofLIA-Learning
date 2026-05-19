'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LIA_PANEL_WIDTH } from '@/core/hooks/useResponsiveLiaLayout';
import { SofLIAPersonalizationSettings } from '../../../features/lia/components/SofLIAPersonalizationSettings';
import { useLiaSidePanelLogic } from './hooks/useLiaSidePanelLogic';
import { PanelHeader } from './PanelHeader';
import { MessagesDisplay } from './MessagesDisplay';
import { InputArea } from './InputArea';
import { HistoryOverlay } from './HistoryOverlay';
import { DeleteConversationModal } from './DeleteConversationModal';

function LiaSidePanelContent() {
  const {
    t, user, isOpen, closePanel,
    isDarkMode, isLightTheme, themeColors,
    messages, isLoading, clearHistory, currentConversationId,
    inputValue, setInputValue, inputRef, messagesEndRef, chatContainerRef,
    handleChatScroll, handleSendMessage, handleQuickAction, handleKeyDown, handleLinkClick, quickActions,
    currentTip, tips,
    isSpeaking, isVoiceEnabled,
    isDictationEnabled, isDictating, isProcessingDictation, interimTranscript, finalTranscript, dictationError, setDictationError, toggleDictation, stopDictation,
    isOptionsMenuOpen, setIsOptionsMenuOpen, optionsMenuRef,
    isPersonalizationOpen, setIsPersonalizationOpen,
    isAvatarExpanded, setIsAvatarExpanded,
    showHistory, setShowHistory, closeHistory, historyList, isHistoryLoading,
    editingConversationId, editingTitle, setEditingTitle, deletingConversationId, showDeleteConfirm, conversationToDelete,
    deleteError, setDeleteError,
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
              maxWidth: `${LIA_PANEL_WIDTH}px`,
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
            <PanelHeader
              t={t}
              themeColors={themeColors}
              isLightTheme={isLightTheme}
              showHistory={showHistory}
              closeHistory={closeHistory}
              setShowHistory={setShowHistory}
              isOptionsMenuOpen={isOptionsMenuOpen}
              setIsOptionsMenuOpen={setIsOptionsMenuOpen}
              optionsMenuRef={optionsMenuRef}
              setIsPersonalizationOpen={setIsPersonalizationOpen}
              clearHistory={clearHistory}
              messages={messages}
              closePanel={closePanel}
              setIsAvatarExpanded={setIsAvatarExpanded}
            />

            <MessagesDisplay
              messages={messages}
              isLoading={isLoading}
              currentTip={currentTip}
              themeColors={themeColors}
              isLightTheme={isLightTheme}
              isDarkMode={isDarkMode}
              handleLinkClick={handleLinkClick}
              quickActions={quickActions}
              handleQuickAction={handleQuickAction}
              messagesEndRef={messagesEndRef}
              chatContainerRef={chatContainerRef}
              handleChatScroll={handleChatScroll}
            />

            <InputArea
              t={t}
              themeColors={themeColors}
              isLightTheme={isLightTheme}
              inputValue={inputValue}
              setInputValue={setInputValue}
              inputRef={inputRef}
              isDictating={isDictating}
              isDictationEnabled={isDictationEnabled}
              isProcessingDictation={isProcessingDictation}
              interimTranscript={interimTranscript}
              finalTranscript={finalTranscript}
              stopDictation={stopDictation}
              toggleDictation={toggleDictation}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
            />

            {dictationError && (
              <div className="mx-4 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 flex items-center justify-between">
                <span>{dictationError}</span>
                <button onClick={() => setDictationError(null)} className="ml-2 text-red-400 hover:text-red-300">×</button>
              </div>
            )}

            {/* History Overlay */}
            <AnimatePresence>
              {showHistory && (
                <HistoryOverlay
                  themeColors={themeColors}
                  isHistoryLoading={isHistoryLoading}
                  historyList={historyList}
                  closeHistory={closeHistory}
                  editingConversationId={editingConversationId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  deletingConversationId={deletingConversationId}
                  handleSelectConversation={handleSelectConversation}
                  handleStartEdit={handleStartEdit}
                  handleSaveEdit={handleSaveEdit}
                  handleCancelEdit={handleCancelEdit}
                  handleDeleteClick={handleDeleteClick}
                  currentPage={currentPage}
                  totalConversations={totalConversations}
                  hasMore={hasMore}
                  handleNextPage={handleNextPage}
                  handlePrevPage={handlePrevPage}
                />
              )}
            </AnimatePresence>

            {/* Delete Error */}
            {deleteError && (
              <div className="mx-4 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 flex items-center justify-between">
                <span>{deleteError}</span>
                <button onClick={() => setDeleteError(null)} className="ml-2 text-red-400 hover:text-red-300">×</button>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
              {showDeleteConfirm && conversationToDelete && (
                <DeleteConversationModal
                  themeColors={themeColors}
                  conversationToDelete={conversationToDelete}
                  deletingConversationId={deletingConversationId}
                  handleCancelDelete={handleCancelDelete}
                  handleConfirmDelete={handleConfirmDelete}
                />
              )}
            </AnimatePresence>

            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              @keyframes liaPulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>

            {/* Expanded Avatar Overlay */}
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
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: 'relative' }}
                  >
                    <motion.img
                      layoutId="lia-avatar-header"
                      src="/lia-avatar.webp"
                      alt="SofLIA Expanded"
                      style={{
                        width: 'min(80vw, 400px)',
                        height: 'min(80vw, 400px)',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `4px solid ${themeColors.accentColor}`,
                        boxShadow: `0 0 50px color-mix(in srgb, ${themeColors.accentColor} 50.2%, transparent)`,
                      }}
                    />
                    <div style={{ marginTop: '20px', textAlign: 'center', color: 'white' }}>
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

      {/* Personalización Modal */}
      {isPersonalizationOpen && (
        <SofLIAPersonalizationSettings
          isOpen={isPersonalizationOpen}
          onClose={() => setIsPersonalizationOpen(false)}
        />
      )}
    </>
  );
}

export { LiaSidePanelContent };
