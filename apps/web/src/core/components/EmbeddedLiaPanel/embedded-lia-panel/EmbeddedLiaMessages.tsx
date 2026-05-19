'use client';

import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { SofLIAMessage } from '../../../types/lia.types';
import type { EmbeddedLiaColors, EmbeddedLiaModeOption } from './types';
import { EmbeddedLiaRichText } from './EmbeddedLiaRichText';

interface EmbeddedLiaMessagesProps {
  assistantName: string;
  assistantAvatar: string;
  colors: EmbeddedLiaColors;
  currentModeData: EmbeddedLiaModeOption;
  messages: SofLIAMessage[];
  isLoading: boolean;
  userProfilePictureUrl?: string | null;
  userDisplayName?: string | null;
  onNavigate: (href: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function EmbeddedLiaMessages({
  assistantName,
  assistantAvatar,
  colors,
  currentModeData,
  messages,
  isLoading,
  userProfilePictureUrl,
  userDisplayName,
  onNavigate,
  messagesEndRef,
}: EmbeddedLiaMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative">
      {messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center">
              <div
                className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors.accent} 8.2%, transparent)`,
                  border: `3px solid ${colors.accent}`,
                  boxShadow: `0 0 40px color-mix(in srgb, ${colors.accent} 25.1%, transparent), 0 0 80px color-mix(in srgb, ${colors.accent} 12.5%, transparent)`,
                }}
              >
                <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover" />
              </div>
            </div>
            <h3 className="font-bold mb-2 text-xl" style={{ color: colors.text }}>
              {currentModeData.name}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${colors.text} 50.2%, transparent)` }}>
              {currentModeData.description}
            </p>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {message.role === 'user' ? (
                <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border-2 border-success relative">
                  {userProfilePictureUrl ? (
                    <img src={userProfilePictureUrl} alt={userDisplayName || 'Usuario'} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                    >
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 dark:ring-accent/30 relative">
                  <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover" />
                </div>
              )}

              <div
                className="flex-1 rounded-2xl px-3.5 py-3 shadow-lg"
                style={{
                  backgroundColor: message.role === 'user' ? colors.accent : colors.primary,
                  color: 'var(--color-bg-light)',
                }}
              >
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                  <EmbeddedLiaRichText text={message.content} onNavigate={onNavigate} />
                </p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 dark:ring-accent/30 relative">
                <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover" />
              </div>
              <div className="bg-primary dark:bg-primary rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.div
                      key={delay}
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
