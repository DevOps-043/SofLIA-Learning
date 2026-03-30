'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Users, Reply } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { sanitizeComment } from '../../../../lib/sanitize/html-sanitizer';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_edited: boolean;
  user: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  communitySlug: string;
  initialComments?: Comment[];
  onCommentAdded?: (comment: Comment) => void;
}

export function CommentsSection({ 
  postId, 
  communitySlug, 
  initialComments = [], 
  onCommentAdded 
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, postId, communitySlug]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        onCommentAdded?.(data.comment);
      } else {
        const errorData = await response.json();
        alert('Error al crear el comentario: ' + errorData.error);
      }
    } catch (error) {
      alert('Error al crear el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Agregar la respuesta al comentario correspondiente
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), data.comment] }
            : comment
        ));
        setReplyContent('');
        setReplyingTo(null);
      } else {
        const errorData = await response.json();
        alert('Error al crear la respuesta: ' + errorData.error);
      }
    } catch (error) {
      alert('Error al crear la respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (user: Comment['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Usuario';
  };

  const getUserInitials = (user: Comment['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="mt-4">
      {/* Botón para mostrar/ocultar comentarios */}
      <motion.button
        onClick={() => setShowComments(!showComments)}
        className="group flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 text-slate-300 hover:text-white transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 mb-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
        <span className="text-sm font-medium">
          {comments.length} comentarios
        </span>
        <motion.div
          animate={{ rotate: showComments ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Formulario de nuevo comentario */}
            <motion.div 
              className="bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none transition-all duration-200"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-slate-400">
                      {newComment.length}/1000
                    </span>
                    <motion.button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Enviando...' : 'Comentar'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lista de comentarios */}
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-slate-800/40 via-slate-700/20 to-slate-800/40 rounded-2xl p-5 border border-slate-600/30 backdrop-blur-sm hover:border-slate-500/40 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden shadow-lg">
                      {comment.user.profile_picture_url ? (
                        <img 
                          src={comment.user.profile_picture_url} 
                          alt={getUserDisplayName(comment.user)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getUserInitials(comment.user)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-semibold text-white">
                          {getUserDisplayName(comment.user)}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p 
                        className="text-slate-300 mb-4 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeComment(comment.content) }}
                      />
                      
                      {/* Botón de responder */}
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="group flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all duration-200 hover:bg-blue-500/10 px-3 py-1 rounded-lg"
                      >
                        <Reply className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-sm font-medium">Responder</span>
                      </button>

                      {/* Formulario de respuesta */}
                      <AnimatePresence>
                        {replyingTo === comment.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 bg-slate-700/30 rounded-lg p-3"
                          >
                            <div className="flex gap-2">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Escribe una respuesta..."
                                className="flex-1 bg-slate-600/50 border border-slate-500/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                                rows={2}
                              />
                              <Button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim() || isSubmitting}
                                className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Respuestas */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-slate-700/30 rounded-lg p-3">
                              <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
                                  {reply.user.profile_picture_url ? (
                                    <img 
                                      src={reply.user.profile_picture_url} 
                                      alt={getUserDisplayName(reply.user)}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    getUserInitials(reply.user)
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white text-sm">
                                      {getUserDisplayName(reply.user)}
                                    </span>
                                    <span className="text-slate-400 text-xs">
                                      {formatTimeAgo(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-slate-200 text-sm">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
