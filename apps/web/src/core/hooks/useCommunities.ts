import useSWR from 'swr';

interface CommunityFetchError extends Error {
  status?: number
  info?: Record<string, unknown>
}

/**
 * Hook para obtener lista de comunidades con cache inteligente
 * 
 * Características:
 * - Cache automático en cliente
 * - Revalidación on focus y on reconnect
 * - Deduplicación de requests
 * - Estados de loading y error
 * 
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useCommunities() {
  const { data, error, isLoading, mutate } = useSWR('/api/communities', async (url: string) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      const fetchError = Object.assign(
        new Error(errorData.error || errorData.message || 'Error al cargar comunidades'),
        { status: res.status, info: errorData }
      ) as CommunityFetchError;
      throw fetchError;
    }
    
    const result = await res.json();
    
    // Asegurar que siempre retornamos un objeto con la estructura esperada
    if (!result.communities) {
      return {
        communities: [],
        total: 0
      };
    }
    
    return result;
  }, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: (error: { status?: number }) => {
      return error?.status !== 404;
    },
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  });

  return {
    communities: data,
    isLoading,
    isError: error,
    mutate, // Para actualizaciones optimistas
  };
}

/**
 * Hook para obtener detalle de una comunidad específica
 * 
 * @param {string} slug - Slug de la comunidad
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useCommunity(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? `/api/communities/${slug}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    community: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook para obtener posts de una comunidad con infinite scroll
 * 
 * @param {string} slug - Slug de la comunidad
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useCommunityPosts(slug: string | null, page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? `/api/communities/${slug}/posts?page=${page}&limit=${limit}` : null,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 120000, // Refresco cada 2 min (antes: 30 s — demasiado agresivo para contenido social)
    }
  );

  return {
    posts: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook para noticias con cache
 * 
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useNews(page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/news?page=${page}&limit=${limit}`,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    news: data,
    isLoading,
    isError: error,
    mutate,
  };
}
