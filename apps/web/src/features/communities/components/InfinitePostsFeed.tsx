'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useInfiniteScroll } from '../../../core/hooks/useIntersectionObserver'
import { OptimizedPostCard } from './OptimizedPostCard'
import { PostsSkeleton } from './CommunitySkeletons'

// Tipo genérico para permitir cualquier tipo de post
type GenericPost = Record<string, any> & { id: string }

interface InfinitePostsFeedProps<T = GenericPost> {
  communitySlug: string
  initialPosts?: T[]
  renderPost?: (post: T, index: number) => React.ReactNode
  onPostsUpdate?: (posts: T[]) => void
}

export function InfinitePostsFeed<T extends GenericPost = GenericPost>({ 
  communitySlug, 
  initialPosts = [],
  renderPost,
  onPostsUpdate
}: InfinitePostsFeedProps<T>) {
  // Eliminar duplicados de posts iniciales
  const uniqueInitialPosts = React.useMemo(() => {
    const seen = new Set<string>()
    return initialPosts.filter(post => {
      if (seen.has(post.id)) return false
      seen.add(post.id)
      return true
    })
  }, [initialPosts])

  const [posts, setPosts] = useState<T[]>(uniqueInitialPosts)
  const [page, setPage] = useState(2) // Empezar en página 2 ya que initialPosts es la página 1
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Sincronizar cuando cambian los posts iniciales (nuevo post creado, editado o eliminado)
  useEffect(() => {
    const initialPostIds = new Set(uniqueInitialPosts.map(p => p.id))
    
    setPosts(prevPosts => {
      // Primero, eliminar posts que ya no están en initialPosts (eliminados)
      const filteredPosts = prevPosts.filter(p => initialPostIds.has(p.id))
      
      // Luego, actualizar posts existentes y agregar nuevos
      const updatedPosts = filteredPosts.map(prevPost => {
        const updatedPost = uniqueInitialPosts.find(p => p.id === prevPost.id)
        return updatedPost || prevPost
      })
      
      // Agregar cualquier post nuevo que no esté en prevPosts
      const existingIds = new Set(updatedPosts.map(p => p.id))
      const newPosts = uniqueInitialPosts.filter(p => !existingIds.has(p.id))
      
      return [...updatedPosts, ...newPosts]
    })
  }, [uniqueInitialPosts]) // Depender del array completo para detectar cambios

  const loadMorePosts = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/communities/${communitySlug}/posts?page=${page}&limit=10`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const data = await response.json()
        const newPosts = data.posts || []
        
        if (newPosts.length === 0) {
          setHasMore(false)
        } else {
          // Eliminar duplicados comparando por ID
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const uniqueNewPosts = newPosts.filter((post: T) => !existingIds.has(post.id))
            
            
            // Si no hay posts nuevos únicos, no hay más por cargar
            if (uniqueNewPosts.length === 0) {
              setHasMore(false)
              return prev
            }
            
            return [...prev, ...uniqueNewPosts]
          })
          setPage(prev => prev + 1)
        }
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [communitySlug, page, loading])

  const loadMoreRef = useInfiniteScroll(loadMorePosts, hasMore && !loading)

  return (
    <div className="space-y-6">
      {/* Posts list */}
      {posts.map((post, index) => (
        renderPost ? (
          <React.Fragment key={post.id}>
            {renderPost(post, index)}
          </React.Fragment>
        ) : (
          <OptimizedPostCard
            key={post.id}
            post={post}
            communitySlug={communitySlug}
            onReact={() => {}}
            onComment={() => {}}
            onShare={() => {}}
            onPostUpdate={onPostsUpdate ? () => {
              // Recargar posts cuando se actualiza uno
              loadMorePosts()
            } : undefined}
          />
        )
      ))}

      {/* Loading indicator */}
      {loading && <PostsSkeleton />}

      {/* Infinite scroll trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-20" />}

      {/* End of posts */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>Has visto todos los posts</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No hay posts todavía</p>
          <p className="text-slate-500 text-sm mt-2">Sé el primero en publicar algo</p>
        </div>
      )}
    </div>
  )
}
