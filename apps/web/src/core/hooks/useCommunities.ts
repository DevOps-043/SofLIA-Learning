import useSWR from 'swr';

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
      const error = new Error(errorData.error || errorData.message || 'Error al cargar comunidades');
      (error as any).status = res.status;
      (error as any).info = errorData;
      throw error;
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
    // Cache semi-estático: revalidar cada 5 minutos si está en background
    dedupingInterval: 2000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    // Reintentar en caso de error (excepto 404)
    shouldRetryOnError: (error: any) => {
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
    slug ? `/api/communities/${slug}` : null, // null = no hacer request
    {
      dedupingInterval: 2000,
      revalidateOnFocus: true,
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
      // Cache dinámico: revalidar más frecuentemente (posts cambian más)
      dedupingInterval: 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Auto-refresh cada 30 segundos
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
      dedupingInterval: 2000,
      revalidateOnFocus: true,
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
