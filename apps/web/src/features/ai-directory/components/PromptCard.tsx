'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Star, Eye, Download, Heart, Sparkles } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { usePromptFavorites } from '../context/PromptFavoritesContext';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { StarRating } from '@/features/courses/components/StarRating';

interface Prompt {
  prompt_id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  tags: string[];
  difficulty_level: string;
  estimated_time_minutes: number;
  use_cases: string[];
  tips: string[];
  author_id?: string;
  is_featured: boolean;
  is_verified: boolean;
  view_count: number;
  like_count: number;
  download_count: number;
  rating?: number | null;
  rating_count?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ai_categories: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

interface PromptCardProps {
  prompt: Prompt;
  viewMode?: 'grid' | 'list';
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const difficultyLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado'
};

export function PromptCard({ prompt, viewMode = 'grid' }: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // El hook debe usarse siempre, el provider debería estar disponible
  const { toggleFavorite, isFavorite, loading: favoritesLoading, favorites } = usePromptFavorites();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Usar el estado directamente del contexto en lugar de solo isFavorite
  const favorite = mounted && favorites.includes(prompt.prompt_id);

  const handleToggleFavorite = async (promptId: string) => {
    // Verificar directamente con user?.id en lugar de isAuthenticated para evitar problemas de sincronización
    if (!user?.id) {
      // Usar window.location en lugar de router.push para evitar problemas con prefetch
      window.location.href = '/auth';
      return;
    }

    if (!toggleFavorite) {
      return;
    }

    try {
      await toggleFavorite(promptId);
    } catch (error) {
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className={`group relative backdrop-blur-md transition-all duration-300 overflow-hidden ${
        viewMode === 'list' 
          ? 'flex flex-row bg-white dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50' 
          : 'h-full flex flex-col bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-lg dark:shadow-xl'
      }`}
      whileHover={{ y: viewMode === 'grid' ? -4 : 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Featured Badge */}
      {prompt.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/50 dark:border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Destacado</span>
          </div>
        </div>
      )}

      {/* Icon placeholder for list mode */}
      {viewMode === 'list' && (
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 flex items-center justify-center overflow-hidden flex-shrink-0 mr-6 border border-purple-500/30">
          <Sparkles className="w-12 h-12 text-purple-500 dark:text-purple-400" />
        </div>
      )}

      <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'min-w-0' : ''}`}>
        {/* Category Badge */}
        <div className={viewMode === 'list' ? 'mb-2' : 'mb-4'}>
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border"
            style={{ 
              backgroundColor: `${prompt.ai_categories.color}20`,
              color: prompt.ai_categories.color,
              borderColor: `${prompt.ai_categories.color}30`
            }}
          >
            <span>{prompt.ai_categories.name}</span>
          </div>
        </div>

        {/* Title - Different height for list mode */}
        <div className={`${viewMode === 'list' ? 'mb-2' : 'mb-3'} flex-shrink-0`} style={viewMode === 'grid' ? { minHeight: '3rem' } : {}}>
          <h3 className={`text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors ${viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2'}`}>
            {prompt.title}
          </h3>
        </div>

        {/* Description - Different height for list mode */}
        <div className={`mb-4 flex-shrink-0 ${viewMode === 'list' ? 'mb-3' : ''}`} style={viewMode === 'grid' ? { minHeight: '4.5rem' } : {}}>
          <p className={`text-gray-600 dark:text-gray-400 text-sm ${viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {prompt.description}
          </p>
        </div>

        {/* Tags - Different display for list mode */}
        <div className={`flex flex-wrap gap-2 mb-4 flex-shrink-0 ${viewMode === 'list' ? 'mb-3' : ''}`} style={viewMode === 'grid' ? { minHeight: '2rem' } : {}}>
          {prompt.tags.slice(0, viewMode === 'list' ? 5 : 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > (viewMode === 'list' ? 5 : 3) && (
            <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
              +{prompt.tags.length - (viewMode === 'list' ? 5 : 3)}
            </span>
          )}
        </div>

        {/* Bottom section - Different layout for list mode */}
        <div className={`${viewMode === 'list' ? 'flex items-center justify-between gap-4' : ''}`}>
          <div className={viewMode === 'list' ? 'flex-1' : ''}>
            {/* Difficulty and Time */}
            <div className={`flex items-center gap-4 flex-shrink-0 ${viewMode === 'list' ? 'mb-3' : 'mb-4'}`} style={viewMode === 'grid' ? { minHeight: '1.75rem' } : {}}>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${difficultyColors[prompt.difficulty_level as keyof typeof difficultyColors]}`}>
                <span>{difficultyLabels[prompt.difficulty_level as keyof typeof difficultyLabels]}</span>
              </div>
              
              {prompt.estimated_time_minutes && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{prompt.estimated_time_minutes} min</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className={`flex items-center gap-4 text-gray-600 dark:text-gray-400 text-xs flex-shrink-0 ${viewMode === 'list' ? 'mb-0' : 'mb-6'}`}>
              <div className="flex items-center gap-1.5 h-[14px]">
                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs leading-none">{prompt.view_count.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center h-[14px]">
                {prompt.rating && prompt.rating > 0 ? (
                  <div className="flex items-center h-[14px]">
                    <StarRating
                      rating={prompt.rating}
                      size="sm"
                      showRatingNumber={true}
                      reviewCount={prompt.rating_count || 0}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap leading-none h-[14px] flex items-center">
                    Sin calificaciones
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 h-[14px]">
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs leading-none">{prompt.download_count}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-3 relative z-10 ${viewMode === 'list' ? 'mt-0' : 'mt-auto'}`}>
            <Link href={`/prompt-directory/${prompt.slug}`} className={viewMode === 'list' ? '' : 'flex-1'}>
              <Button 
                variant="primary" 
                className={`${viewMode === 'list' ? '' : 'w-full'} group-hover:bg-purple-600 transition-colors`}
              >
                Ver Detalles
              </Button>
            </Link>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleFavorite(prompt.prompt_id);
              }}
              disabled={favoritesLoading || !user?.id}
              className={`relative z-20 p-2 rounded-lg border transition-colors ${
                favorite
                  ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              } ${favoritesLoading || !user?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={!user?.id ? 'Inicia sesión para agregar a favoritos' : favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart 
                className={`w-4 h-4 transition-all ${
                  favorite ? 'text-red-500 fill-current' : 'text-gray-600 dark:text-text-secondary'
                }`} 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />
    </motion.div>
  );
}
