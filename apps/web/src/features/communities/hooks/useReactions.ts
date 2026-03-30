'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReactionData {
  reactions: Record<string, {
    type: string;
    count: number;
    users: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
    hasUserReacted: boolean;
    emoji: string;
  }>;
  totalReactions: number;
  userReaction: string | null;
  stats?: Array<{
    reaction_type: string;
    count: number;
    percentage: number;
  }>;
  topReactions?: Array<{
    reaction_type: string;
    count: number;
    emoji: string;
  }>;
}

interface UseReactionsOptions {
  postId: string;
  communitySlug: string;
  autoFetch?: boolean;
}

export function useReactions({ postId, communitySlug, autoFetch = true }: UseReactionsOptions) {
  const [data, setData] = useState<ReactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReactions = useCallback(async (includeStats = false) => {
    if (!postId || !communitySlug) return;

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/communities/${communitySlug}/posts/${postId}/reactions`, window.location.origin);
      if (includeStats) {
        url.searchParams.set('include_stats', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [postId, communitySlug]);

  const addReaction = useCallback(async (reactionType: string) => {
    if (!postId || !communitySlug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reaction_type: reactionType,
          action: 'add'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      
      // Actualizar datos locales
      await fetchReactions();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postId, communitySlug, fetchReactions]);

  const removeReaction = useCallback(async (reactionType: string) => {
    if (!postId || !communitySlug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reaction_type: reactionType,
          action: 'remove'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      
      // Actualizar datos locales
      await fetchReactions();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postId, communitySlug, fetchReactions]);

  const toggleReaction = useCallback(async (reactionType: string) => {
    if (!data) return;

    const currentUserReaction = data.userReaction;
    
    if (currentUserReaction === reactionType) {
      // Si es la misma reacción, remover
      return await removeReaction(reactionType);
    } else {
      // Si es diferente, cambiar
      return await addReaction(reactionType);
    }
  }, [data, addReaction, removeReaction]);

  const refreshStats = useCallback(async () => {
    if (!postId || !communitySlug) return;

    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/stats`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Refrescar datos con estadísticas
      await fetchReactions(true);
    } catch (err) {
    }
  }, [postId, communitySlug, fetchReactions]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchReactions();
    }
  }, [autoFetch, fetchReactions]);

  return {
    data,
    loading,
    error,
    fetchReactions,
    addReaction,
    removeReaction,
    toggleReaction,
    refreshStats,
  };
}
