'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  MoreHorizontal,
  Edit3,
  Trash2,
  Flag
} from 'lucide-react';
import { sanitizeComment } from '../../../lib/sanitize/html-sanitizer';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    profile_picture_url?: string;
  };
}

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

interface CommentItemProps {
  comment: Comment;
  onReplyAdded?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onReplyAdded }) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };

    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsMenu]);

  // Handlers para opciones del menú
  const handleEdit = () => {
    setShowOptionsMenu(false);
    // TODO: Implementar lógica de edición
    alert('Función de editar en desarrollo');
  };

  const handleDelete = async () => {
    setShowOptionsMenu(false);
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      const response = await fetch(`/api/reels/comments/${comment.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // TODO: Actualizar UI o notificar al componente padre
        alert('Comentario eliminado exitosamente');
      } else {
        alert('Error al eliminar comentario');
      }
    } catch (error) {
      alert('Error al eliminar comentario');
    }
  };

  const handleReport = () => {
    setShowOptionsMenu(false);
    // TODO: Implementar lógica de reporte
    alert('Función de reportar en desarrollo');
  };

  // Cargar respuestas
  const loadReplies = async () => {
    try {
      setIsLoadingReplies(true);
      const response = await fetch(`/api/reels/comments/${comment.id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data);
      }
    } catch (error) {
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Enviar respuesta
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || isSubmittingReply) return;

    try {
      setIsSubmittingReply(true);
      const response = await fetch(`/api/reels/comments/${comment.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReply.trim() }),
      });

      if (response.ok) {
        const newReplyData = await response.json();
        setReplies(prev => [...prev, newReplyData]);
        setNewReply('');
        setShowReplyInput(false);
        
        if (onReplyAdded) {
          onReplyAdded();
        }
      }
    } catch (error) {
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Cargar respuestas cuando se expanden
  useEffect(() => {
    if (showReplies && replies.length === 0) {
      loadReplies();
    }
  }, [showReplies]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Ahora';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      {/* Comentario Principal */}
      <div className="flex gap-3 p-3 hover:bg-[#E9ECEF]/30 dark:hover:bg-[#1E2329]/50 rounded-xl transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 flex items-center justify-center border border-[#00D4B3]/30">
            {comment.users.profile_picture_url ? (
              <img
                src={comment.users.profile_picture_url}
                alt={comment.users.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-[#00D4B3]" />
            )}
          </div>
        </div>

        {/* Contenido del comentario */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="font-semibold text-sm text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              {comment.users.username}
            </span>
            <span 
              className="text-xs text-[#6C757D] dark:text-white/60"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              {formatDate(comment.created_at)}
            </span>
            <div className="relative ml-auto" ref={menuRef}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] rounded-lg"
              >
                <MoreHorizontal className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
              </button>

              {/* Menú de opciones - SOFLIA */}
              <AnimatePresence>
                {showOptionsMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1E2329] rounded-xl shadow-lg border border-[#E9ECEF] dark:border-[#6C757D]/30 z-50 overflow-hidden"
                  >
                    <div className="py-1">
                      <button
                        onClick={handleEdit}
                        className="flex items-center w-full px-4 py-2 text-sm text-[#0A2540] dark:text-white hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        <Edit3 className="w-4 h-4 mr-3 text-[#6C757D] dark:text-white/60" />
                        Editar
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        Eliminar
                      </button>
                      <button
                        onClick={handleReport}
                        className="flex items-center w-full px-4 py-2 text-sm text-[#0A2540] dark:text-white hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        <Flag className="w-4 h-4 mr-3 text-[#6C757D] dark:text-white/60" />
                        Reportar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <p 
            className="text-sm text-[#0A2540] dark:text-white mb-2.5 leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            dangerouslySetInnerHTML={{ __html: sanitizeComment(comment.content) }}
          />
          
          {/* Botones de acción */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1.5 text-[#6C757D] dark:text-white/60 hover:text-[#00D4B3] dark:hover:text-[#00D4B3] transition-colors group"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs">Responder</span>
            </button>
          </div>

          {/* Input de respuesta - SOFLIA */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <form onSubmit={handleSubmitReply} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Escribe una respuesta..."
                      className="w-full px-3 py-2 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-white dark:bg-[#1E2329] text-sm font-normal text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all duration-200"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      disabled={isSubmittingReply}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newReply.trim() || isSubmittingReply}
                    className="p-2 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    {isSubmittingReply ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón para mostrar respuestas */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors mt-2 text-xs font-medium"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Ocultar {replies.length} respuesta{replies.length !== 1 ? 's' : ''}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Ver {replies.length} respuesta{replies.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Respuestas - SOFLIA */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="ml-7 border-l-2 border-[#E9ECEF] dark:border-[#6C757D]/30 pl-4 space-y-2 mt-2"
          >
            {isLoadingReplies ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#00D4B3] border-t-transparent"></div>
              </div>
            ) : (
              replies.map((reply) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2.5 p-2 hover:bg-[#E9ECEF]/30 dark:hover:bg-[#1E2329]/50 rounded-lg transition-colors"
                >
                  {/* Avatar de respuesta */}
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 flex items-center justify-center border border-[#00D4B3]/30">
                      {reply.users.profile_picture_url ? (
                        <img
                          src={reply.users.profile_picture_url}
                          alt={reply.users.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-[#00D4B3]" />
                      )}
                    </div>
                  </div>

                  {/* Contenido de la respuesta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="font-semibold text-xs text-[#0A2540] dark:text-white"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        {reply.users.username}
                      </span>
                      <span 
                        className="text-xs text-[#6C757D] dark:text-white/60"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <p 
                      className="text-xs text-[#0A2540] dark:text-white leading-relaxed"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      dangerouslySetInnerHTML={{ __html: sanitizeComment(reply.content) }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
