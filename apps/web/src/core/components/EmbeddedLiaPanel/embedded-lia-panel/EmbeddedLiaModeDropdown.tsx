'use client';

import type { RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { EmbeddedLiaColors, EmbeddedLiaChatMode, EmbeddedLiaModeOption } from './types';

interface EmbeddedLiaModeDropdownProps {
  isOpen: boolean;
  position: { top: number; left: number; width: number };
  assistantName: string;
  assistantAvatar: string;
  colors: EmbeddedLiaColors;
  availableModes: EmbeddedLiaModeOption[];
  currentMode: EmbeddedLiaChatMode;
  onClose: () => void;
  onSelectMode: (mode: EmbeddedLiaChatMode) => void;
  dropdownRef: RefObject<HTMLDivElement>;
}

export function EmbeddedLiaModeDropdown({
  isOpen,
  position,
  assistantName,
  assistantAvatar,
  colors,
  availableModes,
  currentMode,
  onClose,
  onSelectMode,
  dropdownRef,
}: EmbeddedLiaModeDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55]"
          />
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.primary}30`,
            }}
            className="rounded-xl shadow-2xl overflow-hidden z-[60]"
          >
            {availableModes.map((mode) => {
              const isActive = currentMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onSelectMode(mode.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-3 text-xs transition-colors flex items-start gap-3"
                  style={{ backgroundColor: isActive ? `${colors.primary}15` : 'transparent' }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
                      style={{ boxShadow: `0 0 0 2px ${colors.accent}50` }}
                    >
                      <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold mb-0.5" style={{ color: colors.text }}>
                        {mode.name}
                      </div>
                      <div className="text-[10px] leading-tight" style={{ color: `${colors.text}70` }}>
                        {mode.description}
                      </div>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
