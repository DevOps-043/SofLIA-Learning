import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import type { LiaConversationItem, LiaConversationToDelete } from '../../types';
import { deleteLiaConversation, fetchLiaConversationHistory, renameLiaConversation } from '../../services/lia-side-panel-history.service';

export function useLiaSidePanelHistory(loadConversation: (conversationId: string) => Promise<void>, clearHistory: () => void, currentConversationId: string | null) {
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<LiaConversationItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<LiaConversationToDelete | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;
  const loadHistory = useCallback(async (page = 0) => {
    setIsHistoryLoading(true);
    try {
      const pageData = await fetchLiaConversationHistory(page, limit);
      setHistoryList(pageData.conversations);
      setTotalConversations(pageData.totalConversations);
      setHasMore(pageData.hasMore);
    } catch (error) {
      techDebtLogger.error('Error fetching history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);
  useEffect(() => {
    if (showHistory) loadHistory(currentPage);
  }, [currentPage, loadHistory, showHistory]);
  const closeHistory = useCallback(() => {
    setShowHistory(false); setCurrentPage(0);
  }, []);
  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    closeHistory();
  };
  const handleStartEdit = (conversation: LiaConversationItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingConversationId(conversation.conversation_id);
    setEditingTitle(conversation.conversation_title || new Date(conversation.started_at).toLocaleDateString());
  };
  const handleSaveEdit = async (conversationId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      if (!(await renameLiaConversation(conversationId, editingTitle))) return;
      setHistoryList((list) => list.map((conversation) =>
        conversation.conversation_id === conversationId
          ? { ...conversation, conversation_title: editingTitle }
          : conversation
      ));
      setEditingConversationId(null);
    } catch (error) {
      techDebtLogger.error('Error saving title', error);
    }
  };
  const handleDeleteClick = (conversation: LiaConversationItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setConversationToDelete({
      id: conversation.conversation_id,
      title: conversation.conversation_title || new Date(conversation.started_at).toLocaleDateString(),
    });
    setShowDeleteConfirm(true);
  };
  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    setDeletingConversationId(conversationToDelete.id);
    setShowDeleteConfirm(false);
    try {
      const result = await deleteLiaConversation(conversationToDelete.id);
      if (!result.ok) setDeleteError(`Error al eliminar conversacion: ${result.error || 'Error desconocido'}`);
      else setHistoryList((list) => list.filter((conversation) => conversation.conversation_id !== conversationToDelete.id));
      if (currentConversationId === conversationToDelete.id) clearHistory();
    } catch (error) {
      techDebtLogger.error('Error eliminando conversacion:', error);
      setDeleteError('Error al eliminar conversacion');
    } finally {
      setDeletingConversationId(null); setConversationToDelete(null);
    }
  };

  return {
    showHistory, setShowHistory, closeHistory, historyList, isHistoryLoading,
    editingConversationId, editingTitle, setEditingTitle, deletingConversationId,
    showDeleteConfirm, conversationToDelete, deleteError, setDeleteError,
    currentPage, totalConversations, hasMore, handleSelectConversation,
    handleStartEdit, handleSaveEdit, handleDeleteClick, handleConfirmDelete,
    handleNextPage: () => hasMore && setCurrentPage((page) => page + 1), handlePrevPage: () => currentPage > 0 && setCurrentPage((page) => page - 1),
    handleCancelEdit: (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation(); setEditingConversationId(null);
    },
    handleCancelDelete: () => { setShowDeleteConfirm(false); setConversationToDelete(null); },
  };
}
