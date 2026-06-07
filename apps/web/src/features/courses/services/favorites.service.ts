import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'

type UserFavoriteColumn = 'course_id' | 'id' | 'user_id'
type UserFavoriteError = { code?: string; message: string }
type UserFavoriteRow = {
  course_id: string
  id: string
  user_id: string
}
type UserFavoritePayload = Pick<UserFavoriteRow, 'course_id' | 'user_id'>

type UserFavoritesSelectBuilder<TRow> = PromiseLike<{
  data: TRow[] | null
  error: UserFavoriteError | null
}> & {
  eq(column: UserFavoriteColumn, value: string): UserFavoritesSelectBuilder<TRow>
  maybeSingle(): PromiseLike<{
    data: TRow | null
    error: UserFavoriteError | null
  }>
}

type UserFavoritesDeleteBuilder = PromiseLike<{
  error: UserFavoriteError | null
}> & {
  eq(column: UserFavoriteColumn, value: string): UserFavoritesDeleteBuilder
  select(columns: string): PromiseLike<{
    data: Pick<UserFavoriteRow, 'id'>[] | null
    error: UserFavoriteError | null
  }>
}

type UserFavoritesTable = {
  delete(): UserFavoritesDeleteBuilder
  insert(payload: UserFavoritePayload): PromiseLike<{ error: UserFavoriteError | null }>
  select(columns: string): UserFavoritesSelectBuilder<UserFavoriteRow>
  upsert(
    payload: UserFavoritePayload,
    options: { ignoreDuplicates: boolean; onConflict: string },
  ): PromiseLike<{ error: UserFavoriteError | null }>
}

type UserFavoritesClient = {
  from(table: 'user_favorites'): UserFavoritesTable
}

function userFavoritesTable(supabase: unknown): UserFavoritesTable {
  return (supabase as UserFavoritesClient).from('user_favorites')
}

export class FavoritesService {
  /**
   * Obtiene los favoritos de un usuario
   */
  static async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await userFavoritesTable(supabase)
        .select('course_id')
        .eq('user_id', userId)

      if (error) {
        if (process.env.NODE_ENV === 'development') {
        }
        throw new Error(`Error al obtener favoritos: ${error.message}`)
      }

      return data?.map(favorite => favorite.course_id) || []
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }

      // Si es un error de configuración de Supabase, devolver array vacío
      if (error instanceof Error && error.message.includes('Variables de entorno')) {
        return []
      }
      
      throw error
    }
  }

  /**
   * Agrega un curso a favoritos
   */
  static async addToFavorites(userId: string, courseId: string): Promise<void> {
    try {
      const supabase = await createClient()
      const normalizedCourseId = String(courseId).trim()

      // Insertar directamente — manejar duplicado con ON CONFLICT
      const { error } = await userFavoritesTable(supabase)
        .upsert(
          { user_id: userId, course_id: normalizedCourseId },
          { onConflict: 'user_id, course_id', ignoreDuplicates: true }
        )

      if (error) {
        // Duplicados son idempotentes, no son error real
        if (error.code === '23505' || error.message.includes('duplicate')) return
        throw new Error(`Error al agregar a favoritos: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Remueve un curso de favoritos
   */
  static async removeFromFavorites(userId: string, courseId: string): Promise<void> {
    try {
      const supabase = await createClient()
      const normalizedCourseId = String(courseId).trim()

      // Eliminar directamente — idempotente si no existe
      const { error } = await userFavoritesTable(supabase)
        .delete()
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)

      if (error) {
        throw new Error(`Error al remover de favoritos: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Verifica si un curso está en favoritos
   */
  static async isFavorite(userId: string, courseId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      // Normalizar courseId para evitar problemas de comparación
      const normalizedCourseId = String(courseId).trim()
      
      const { data, error } = await userFavoritesTable(supabase)
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)
        .maybeSingle()

      // PGRST116 = no rows returned (no es un error, simplemente no existe)
      if (error && error.code !== 'PGRST116') {
        if (process.env.NODE_ENV === 'development') {
          techDebtLogger.error('Error checking favorite status:', error, { userId, courseId: normalizedCourseId })
        }
        throw new Error(`Error al verificar favorito: ${error.message}`)
      }

      const result = !!data
      
      if (process.env.NODE_ENV === 'development') {

      }
      
      return result
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        techDebtLogger.error('Error in FavoritesService.isFavorite:', error)
      }

      // Si es un error de configuración de Supabase, devolver false
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        return false
      }
      
      throw error
    }
  }

  /**
   * Alterna el estado de favorito de un curso.
   * Optimizado: 1-2 queries en vez de 4-5 secuenciales.
   */
  static async toggleFavorite(userId: string, courseId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const normalizedCourseId = String(courseId).trim()

      // Intentar eliminar primero — si devuelve filas, el favorito existía
      const { data: deleted, error: deleteError } = await userFavoritesTable(supabase)
        .delete()
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)
        .select('id')

      if (deleteError) {
        throw new Error(`Error al gestionar favorito: ${deleteError.message}`)
      }

      if (deleted && deleted.length > 0) {
        // Se eliminó: era favorito, ya no lo es
        return false
      }

      // No existía — insertar como nuevo favorito
      const { error: insertError } = await userFavoritesTable(supabase)
        .insert({ user_id: userId, course_id: normalizedCourseId })

      if (insertError) {
        // Si es duplicado por race condition, considerar como éxito
        if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
          return true
        }
        throw new Error(`Error al agregar a favoritos: ${insertError.message}`)
      }

      return true
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        return true
      }
      throw error
    }
  }
}
