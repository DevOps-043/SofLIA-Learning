'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  MessageCircle,
  Search
} from 'lucide-react';
import { CommentItem } from './CommentItem';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    profile_picture_url?: string;
  };
}

interface CommentsPanelProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
  isMobile: boolean;
  onCommentAdded?: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  reelId,
  isOpen,
  onClose,
  commentCount,
  isMobile,
  onCommentAdded
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar comentarios
  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reels/${reelId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar comentario
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        
        // Notificar al componente padre que se agregó un comentario
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar comentarios cuando se abre el panel
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, reelId]);

  // Filtrar comentarios por búsqueda
  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.users.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`absolute bg-white dark:bg-[#0F1419] shadow-2xl flex flex-col ${
            isMobile 
              ? 'bottom-0 left-0 right-0 h-4/5 rounded-t-xl' 
              : 'top-0 right-0 w-[420px] h-full rounded-l-xl'
          }`}
          data-comments-panel
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header - Minimalista con SOFLIA */}
          <div className="bg-[#0A2540] dark:bg-[#0A2540] px-6 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00D4B3]/20 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-[#00D4B3]" />
                </div>
                <div>
                  <h2 
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                  >
                    Comentarios
                  </h2>
                  <p 
                    className="text-sm text-white/80"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    {commentCount} comentario{commentCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Barra de búsqueda - Unificada con talleres/comunidades */}
          <div className="p-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D] dark:text-[#6C757D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar comentarios..."
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-sm font-normal text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[#6C757D] dark:text-[#6C757D]" />
                </button>
              )}
            </div>
          </div>

          {/* Comentarios */}
          <div 
            className="flex-1 overflow-y-auto bg-white dark:bg-[#0F1419]"
            onWheel={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30"></div>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00D4B3] border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p 
                  className="mt-4 text-sm text-[#6C757D] dark:text-white/60"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Cargando comentarios...
                </p>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-[#00D4B3]" />
                  </div>
                </div>
                <h3 
                  className="text-base font-semibold text-[#0A2540] dark:text-white mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  {searchQuery ? 'No se encontraron comentarios' : 'No hay comentarios aún'}
                </h3>
                <p 
                  className="text-sm text-[#6C757D] dark:text-white/60"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : '¡Sé el primero en comentar!'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-1">
                <AnimatePresence>
                  {filteredComments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <CommentItem 
                        comment={comment} 
                        onReplyAdded={onCommentAdded}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Input de comentario - Minimalista SOFLIA */}
          <div className="p-4 bg-white dark:bg-[#0F1419] border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full px-4 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-white dark:bg-[#1E2329] text-sm font-normal text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="p-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
