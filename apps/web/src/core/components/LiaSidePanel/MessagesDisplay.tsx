'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { parseMarkdownContent } from './utils/parseMarkdown';
import { LiaThemeColors, LiaQuickAction, LiaMessage } from './types';
import { LiaQuickActionsChips } from './LiaQuickActionsChips';

interface MessagesDisplayProps {
  messages: LiaMessage[];
  isLoading: boolean;
  currentTip: string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  isDarkMode: boolean;
  handleLinkClick: (url: string) => void;
  quickActions: LiaQuickAction[];
  handleQuickAction: (action: LiaQuickAction) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  handleChatScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function MessagesDisplay({
  messages,
  isLoading,
  currentTip,
  themeColors,
  isLightTheme,
  isDarkMode,
  handleLinkClick,
  quickActions,
  handleQuickAction,
  messagesEndRef,
  chatContainerRef,
  handleChatScroll,
}: MessagesDisplayProps) {
  return (
    <>
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
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              opacity: 0.8,
              padding: '0 20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '24px', position: 'relative' }}
            >
              <div
                style={{
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
                  zIndex: 0,
                }}
              />
              <img
                src="/lia-avatar.webp"
                alt="SofLIA"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${themeColors.accentColor}`,
                  boxShadow: `0 0 20px ${themeColors.accentColor}40`,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </motion.div>

            <motion.div
              key={currentTip}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 style={{ color: themeColors.textPrimary, fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                SofLIA
              </h3>
              <p
                style={{
                  color: themeColors.textSecondary,
                  fontSize: '14px',
                  lineHeight: 1.5,
                  maxWidth: '280px',
                  margin: '0 auto',
                }}
              >
                {currentTip}
              </p>
            </motion.div>
          </div>
        ) : (
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
                  backgroundColor:
                    message.role === 'user'
                      ? themeColors.messageBubbleUser
                      : themeColors.messageBubbleAssistant,
                  color: message.role === 'user' ? 'white' : themeColors.textPrimary,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >

                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.5,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.role === 'assistant'
                    ? parseMarkdownContent(message.content, handleLinkClick, isDarkMode)
                    : message.content}
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
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.accentColor,
                  animation: 'liaPulse 1s infinite',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.accentColor,
                  animation: 'liaPulse 1s infinite 0.2s',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.accentColor,
                  animation: 'liaPulse 1s infinite 0.4s',
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <LiaQuickActionsChips
        quickActions={quickActions}
        isLoading={false}
        isLightTheme={isLightTheme}
        themeColors={themeColors}
        onActionClick={handleQuickAction}
      />
    </>
  );
}
