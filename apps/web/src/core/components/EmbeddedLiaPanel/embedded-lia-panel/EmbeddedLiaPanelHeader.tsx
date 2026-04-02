'use client';

import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, MessageSquare, X } from 'lucide-react';
import type { EmbeddedLiaColors, EmbeddedLiaModeOption } from './types';

interface EmbeddedLiaPanelHeaderProps {
  assistantName: string;
  assistantAvatar: string;
  colors: EmbeddedLiaColors;
  currentModeData: EmbeddedLiaModeOption;
  isModeDropdownOpen: boolean;
  onToggleModeDropdown: () => void;
  onClearHistory: () => void;
  onCollapse: () => void;
  modeButtonRef: RefObject<HTMLButtonElement | null>;
}

export function EmbeddedLiaPanelHeader({
  assistantName,
  assistantAvatar,
  colors,
  currentModeData,
  isModeDropdownOpen,
  onToggleModeDropdown,
  onClearHistory,
  onCollapse,
  modeButtonRef,
}: EmbeddedLiaPanelHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="backdrop-blur-md rounded-2xl shadow-lg"
      style={{
        backgroundColor: `${colors.cardBg}F5`,
        border: `1px solid ${colors.primary}30`,
      }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="relative flex-1 min-w-0">
          <button
            ref={modeButtonRef}
            onClick={onToggleModeDropdown}
            className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors group"
            style={{ backgroundColor: 'transparent' }}
          >
            <div
              className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
              style={{ boxShadow: `0 0 0 2px ${colors.accent}50` }}
            >
              <img src={assistantAvatar} alt={assistantName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h3 className="font-semibold text-xs leading-tight" style={{ color: colors.text }}>
                {assistantName}
              </h3>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 flex-shrink-0" style={{ color: currentModeData.color }} />
                <span className="text-[10px] leading-tight truncate" style={{ color: `${colors.text}80` }}>
                  {currentModeData.name}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${isModeDropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: `${colors.text}80` }}
            />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: `${colors.text}80` }}
            title="Limpiar conversacion"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: `${colors.text}80` }}
            title="Colapsar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
