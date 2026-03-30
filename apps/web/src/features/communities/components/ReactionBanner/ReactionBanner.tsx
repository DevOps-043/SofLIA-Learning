'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionBannerProps {
  totalReactions: number;
  topReactions?: Array<{
    reaction_type: string;
    count: number;
    emoji: string;
  }>;
  className?: string;
  showTopReactions?: boolean;
  onReactionClick?: (reactionType: string) => void;
  postId?: string;
}

export function ReactionBanner({ 
  totalReactions, 
  topReactions = [], 
  className = '',
  showTopReactions = true,
  onReactionClick,
  postId
}: ReactionBannerProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Debug temporal

  // Si no hay reacciones, no mostrar nada
  if (totalReactions === 0) {
    return null;
  }

  // Si hay reacciones pero no tenemos datos de topReactions, mostrar contador simple
  if (showTopReactions && (!topReactions || topReactions.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center space-x-1 text-sm text-gray-600 dark:text-slate-400 ${className}`}
      >
        <span className="font-medium">
          {totalReactions} {totalReactions === 1 ? 'reacción' : 'reacciones'}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      {/* Top reacciones (máximo 3) - Estilo Facebook */}
      {showTopReactions && topReactions.length > 0 && (
        <>
          {topReactions.slice(0, 3).map((reaction, index) => (
            <motion.button
              key={reaction.reaction_type}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring", 
                stiffness: 500, 
                damping: 30 
              }}
              onClick={() => onReactionClick?.(reaction.reaction_type)}
              className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-slate-700/30 rounded-lg px-2 py-1 transition-colors group"
              title={`Ver quién reaccionó con ${reaction.emoji}`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200" role="img" aria-label={reaction.reaction_type}>
                {reaction.emoji}
              </span>
              <span className="text-xs text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-300">
                {reaction.count}
              </span>
            </motion.button>
          ))}
        </>
      )}
    </motion.div>
  );
}