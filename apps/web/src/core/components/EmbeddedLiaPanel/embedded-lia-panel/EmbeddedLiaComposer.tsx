'use client';

import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mic, MicOff, Send } from 'lucide-react';
import { buildVoiceInputColors } from '../../../theme/voice-input-colors';
import type { EmbeddedLiaColors } from './types';

interface EmbeddedLiaComposerProps {
  message: string;
  setMessage: (value: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  colors: EmbeddedLiaColors;
  onSend: () => Promise<void>;
  onToggleRecording: () => void;
  messageInputRef: RefObject<HTMLTextAreaElement>;
}

export function EmbeddedLiaComposer({
  message,
  setMessage,
  isLoading,
  isRecording,
  colors,
  onSend,
  onToggleRecording,
  messageInputRef,
}: EmbeddedLiaComposerProps) {
  // El micrófono usa el acento de la organización (o el de la plataforma si no
  // hay branding) para que se distinga del fondo neutro del compositor.
  const voiceColors = buildVoiceInputColors(colors.accent);

  return (
    <div className="px-3 pb-3 pt-2 bg-transparent">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (message.trim()) {
                  void onSend();
                }
              }
            }}
            placeholder="Escribe tu pregunta..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md min-h-[44px] text-sm font-normal focus:outline-none transition-all duration-200 max-h-[60px] overflow-y-auto leading-5"
            style={{
              minHeight: '44px',
              lineHeight: '20px',
              fontFamily: 'Inter, sans-serif',
              backgroundColor: colors.cardBg,
              border: `1px solid color-mix(in srgb, ${colors.primary} 18.8%, transparent)`,
              color: colors.text,
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (message.trim()) {
              void onSend();
            } else {
              onToggleRecording();
            }
          }}
          disabled={isLoading && !!message.trim()}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${isLoading && message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: message.trim() ? colors.primary : isRecording ? 'var(--color-error)' : voiceColors.background,
            border: message.trim() || isRecording ? 'none' : `1px solid ${voiceColors.border}`,
            color: message.trim() || isRecording ? 'var(--color-bg-light)' : voiceColors.icon,
          }}
          title={message.trim() ? 'Enviar mensaje' : isRecording ? 'Detener grabacion' : 'Grabar audio'}
        >
          {isLoading && message.trim() ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : message.trim() ? (
            <Send className="w-5 h-5" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
