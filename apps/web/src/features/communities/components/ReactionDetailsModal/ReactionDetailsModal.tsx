'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Heart, ThumbsUp, Laugh, Angry, Frown } from 'lucide-react';

// Componente SVG personalizado para cara de sorpresa 😮
const SurprisedFace = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="9" r="0.4" fill="currentColor" />
    <circle cx="16" cy="9" r="0.4" fill="currentColor" />
    <circle cx="12" cy="15" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

interface ReactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  communitySlug: string;
  selectedReactionType?: string;
}

interface ReactionUser {
  id: string;
  name: string;
  avatar?: string;
  reaction_type: string;
  created_at: string;
}

interface ReactionStats {
  reaction_type: string;
  count: number;
  emoji: string;
  users: ReactionUser[];
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  wow: SurprisedFace,
  sad: Frown,
  angry: Angry,
};

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

const reactionLabels = {
  like: 'Me gusta',
  love: 'Me encanta',
  laugh: 'Me divierte',
  wow: 'Me asombra',
  sad: 'Me entristece',
  angry: 'Me enoja',
};

export function ReactionDetailsModal({ 
  isOpen, 
  onClose, 
  postId, 
  communitySlug,
  selectedReactionType 
}: ReactionDetailsModalProps) {
  const [reactionStats, setReactionStats] = useState<ReactionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(selectedReactionType || 'all');

  useEffect(() => {
    if (isOpen) {
      fetchReactionDetails();
      if (selectedReactionType) {
        setActiveTab(selectedReactionType);
      }
    }
  }, [isOpen, postId, selectedReactionType]);

  const fetchReactionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions?include_stats=true`);
      if (response.ok) {
        const data = await response.json();
        
        // Procesar las reacciones para obtener estadísticas
        const stats: ReactionStats[] = [];
        
        if (data.reactions) {
          Object.entries(data.reactions).forEach(([type, reactionData]: [string, any]) => {
            stats.push({
              reaction_type: type,
              count: reactionData.count,
              emoji: reactionData.emoji,
              users: reactionData.users || []
            });
          });
        }
        
        setReactionStats(stats);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getTotalReactions = () => {
    return reactionStats.reduce((total, stat) => total + stat.count, 0);
  };

  const getActiveReactionStats = () => {
    if (activeTab === 'all') {
      return reactionStats;
    }
    return reactionStats.filter(stat => stat.reaction_type === activeTab);
  };

  const formatUserName = (user: ReactionUser) => {
    return user.name || 'Usuario';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F1419]/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Reacciones</h2>
                <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
                  {getTotalReactions()} reacciones totales
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto flex-shrink-0 scrollbar-hide">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 min-w-fit px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
              }`}
            >
              Todas ({getTotalReactions()})
            </button>
            {reactionStats.map((stat) => {
              const emoji = reactionEmojis[stat.reaction_type as keyof typeof reactionEmojis];
              return (
                <button
                  key={stat.reaction_type}
                  onClick={() => setActiveTab(stat.reaction_type)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === stat.reaction_type
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="text-base sm:text-lg">{emoji}</span>
                  {stat.count}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {getActiveReactionStats().map((stat) => (
                  <div key={stat.reaction_type} className="space-y-2 sm:space-y-3">
                    {activeTab === 'all' && (
                      <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200 dark:border-slate-700">
                        <span className="text-xl sm:text-2xl">{stat.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            {reactionLabels[stat.reaction_type as keyof typeof reactionLabels]}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">{stat.count} reacciones</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1.5 sm:space-y-2">
                      {stat.users.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={formatUserName(user)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-xs sm:text-sm">
                                {formatUserName(user).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {formatUserName(user)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                              {formatDate(user.created_at)}
                            </p>
                          </div>
                          <span className="text-base sm:text-lg flex-shrink-0">
                            {stat.emoji}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {getActiveReactionStats().length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-slate-400" />
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base">No hay reacciones para mostrar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
