'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LiaLiveVoiceButton } from '../lia-live/LiaLiveVoiceButton';
import { useEmbeddedLiaPanel } from './embedded-lia-panel';
import {
  EmbeddedLiaComposer,
  EmbeddedLiaFloatingBubble,
  EmbeddedLiaMessages,
  EmbeddedLiaModeDropdown,
  EmbeddedLiaPanelHeader,
} from './embedded-lia-panel';
import type { EmbeddedLiaPanelProps } from './embedded-lia-panel/types';

export function EmbeddedLiaPanel(props: EmbeddedLiaPanelProps) {
  const {
    assistantName,
    assistantAvatar,
    colors,
    navbarHeight,
    expandedWidth,
    panelRef,
    router,
    user,
    message,
    setMessage,
    isRecording,
    messages,
    isLoading,
    handleSendMessage,
    toggleRecording,
    messageInputRef,
    messagesEndRef,
    isModeDropdownOpen,
    setIsModeDropdownOpen,
    dropdownPosition,
    modeDropdownRef,
    modeButtonRef,
    availableModes,
    currentMode,
    setCurrentMode,
    currentModeData,
    clearHistory,
    isPanelOpen,
    setIsPanelOpen,
    isCollapsed,
    setIsCollapsed,
    voiceError,
    setVoiceError,
  } = useEmbeddedLiaPanel(props);

  return (
    <>
      <AnimatePresence>
        {isPanelOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/10 dark:bg-black/20 z-30"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPanelOpen && !isCollapsed && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(event) => event.stopPropagation()}
            className={`fixed right-0 top-0 h-full z-40 shadow-2xl flex flex-col ${expandedWidth} transition-all duration-300 ease-in-out`}
            style={{
              backgroundColor: colors.cardBg,
              borderLeft: `1px solid color-mix(in srgb, ${colors.primary} 12.5%, transparent)`,
            }}
          >
            <div
              className="absolute left-0 right-0 top-0"
              style={{ height: navbarHeight, backgroundColor: colors.cardBg }}
            />

            <div className="absolute left-0 right-0 z-[60] px-3 pb-2" style={{ top: navbarHeight, paddingTop: '0.75rem' }}>
              <EmbeddedLiaPanelHeader
                assistantName={assistantName}
                assistantAvatar={assistantAvatar}
                colors={colors}
                currentModeData={currentModeData}
                isModeDropdownOpen={isModeDropdownOpen}
                onToggleModeDropdown={() => setIsModeDropdownOpen((prev) => !prev)}
                onClearHistory={clearHistory}
                onCollapse={() => setIsCollapsed(true)}
                modeButtonRef={modeButtonRef}
              />
            </div>

            <EmbeddedLiaModeDropdown
              isOpen={isModeDropdownOpen}
              position={dropdownPosition}
              assistantName={assistantName}
              assistantAvatar={assistantAvatar}
              colors={colors}
              availableModes={availableModes}
              currentMode={currentMode}
              onClose={() => setIsModeDropdownOpen(false)}
              onSelectMode={setCurrentMode}
              dropdownRef={modeDropdownRef}
            />

            <div
              className="flex-1 overflow-hidden flex flex-col"
              style={{
                paddingTop: `calc(${navbarHeight} + 5rem)`,
                backgroundColor: colors.cardBg,
              }}
            >
              <EmbeddedLiaMessages
                assistantName={assistantName}
                assistantAvatar={assistantAvatar}
                colors={colors}
                currentModeData={currentModeData}
                messages={messages}
                isLoading={isLoading}
                userProfilePictureUrl={user?.profile_picture_url}
                userDisplayName={user?.display_name || user?.username || 'Usuario'}
                onNavigate={(href) => router.push(href)}
                messagesEndRef={messagesEndRef}
              />
              {voiceError && (
                <div className="mx-3 mb-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 flex items-center justify-between">
                  <span>{voiceError}</span>
                  <button onClick={() => setVoiceError(null)} className="ml-2 text-red-400 hover:text-red-300">×</button>
                </div>
              )}
              <div className="px-3 pb-1 flex justify-center">
                <LiaLiveVoiceButton />
              </div>
              <EmbeddedLiaComposer
                message={message}
                setMessage={setMessage}
                isLoading={isLoading}
                isRecording={isRecording}
                colors={colors}
                onSend={handleSendMessage}
                onToggleRecording={toggleRecording}
                messageInputRef={messageInputRef}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmbeddedLiaFloatingBubble
        assistantName={assistantName}
        assistantAvatar={assistantAvatar}
        hasMessages={messages.length > 0}
        isVisible={isCollapsed || !isPanelOpen}
        onOpen={() => {
          setIsPanelOpen(true);
          setIsCollapsed(false);
        }}
      />
    </>
  );
}
