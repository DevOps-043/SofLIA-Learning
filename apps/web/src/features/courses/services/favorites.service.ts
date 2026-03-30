import { createClient } from '../../../lib/supabase/server'

export class FavoritesService {
  /**
   * Obtiene los favoritos de un usuario
   */
  static async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_favorites')
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
      
      // Normalizar courseId para evitar problemas de comparación
      const normalizedCourseId = String(courseId).trim()
      
      // Verificar si ya existe antes de insertar
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)
        .maybeSingle()

      if (existing) {
        // Ya existe, no hacer nada
        if (process.env.NODE_ENV === 'development') {

        }
        return
      }

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          course_id: normalizedCourseId
        })

      if (error) {
        // Si es un error de duplicado, ignorarlo
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
          if (process.env.NODE_ENV === 'development') {
          }
          return
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('Error adding to favorites:', error)
        }
        throw new Error(`Error al agregar a favoritos: ${error.message}`)
      }
      
      if (process.env.NODE_ENV === 'development') {

      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in FavoritesService.addToFavorites:', error)
      }
      throw error
    }
  }

  /**
   * Remueve un curso de favoritos
   */
  static async removeFromFavorites(userId: string, courseId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Normalizar courseId para evitar problemas de comparación
      const normalizedCourseId = String(courseId).trim()
      
      // Verificar que existe antes de eliminar
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)
        .maybeSingle()

      if (!existing) {
        // No existe, no hay nada que eliminar
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Intento de eliminar favorito que no existe: userId=${userId}, courseId=${normalizedCourseId}`)
        }
        return
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)
        .select()

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error removing from favorites:', error)
        }
        throw new Error(`Error al remover de favoritos: ${error.message}`)
      }

      // Verificar que se eliminó correctamente
      if (!data || data.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`No se eliminó ningún registro: userId=${userId}, courseId=${normalizedCourseId}`)
        }
        // No lanzar error, pero registrar la advertencia
      } else {
        if (process.env.NODE_ENV === 'development') {

        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in FavoritesService.removeFromFavorites:', error)
      }
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
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', normalizedCourseId)
        .maybeSingle()

      // PGRST116 = no rows returned (no es un error, simplemente no existe)
      if (error && error.code !== 'PGRST116') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking favorite status:', error, { userId, courseId: normalizedCourseId })
        }
        throw new Error(`Error al verificar favorito: ${error.message}`)
      }

      const result = !!data
      
      if (process.env.NODE_ENV === 'development') {

      }
      
      return result
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in FavoritesService.isFavorite:', error)
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
   * Alterna el estado de favorito de un curso
   */
  static async toggleFavorite(userId: string, courseId: string): Promise<boolean> {
    try {
      // Verificar estado actual
      const isCurrentlyFavorite = await this.isFavorite(userId, courseId)
      
      if (process.env.NODE_ENV === 'development') {

      }
      
      if (isCurrentlyFavorite) {
        // Remover de favoritos
        await this.removeFromFavorites(userId, courseId)
        
        // Verificar que se eliminó correctamente
        const stillFavorite = await this.isFavorite(userId, courseId)
        if (stillFavorite) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Error: El favorito no se eliminó correctamente. userId=${userId}, courseId=${courseId}`)
          }
          throw new Error('No se pudo remover el favorito')
        }
        
        return false
      } else {
        // Agregar a favoritos
        await this.addToFavorites(userId, courseId)
        
        // Verificar que se agregó correctamente
        const nowFavorite = await this.isFavorite(userId, courseId)
        if (!nowFavorite) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Error: El favorito no se agregó correctamente. userId=${userId}, courseId=${courseId}`)
          }
          throw new Error('No se pudo agregar el favorito')
        }
        
        return true
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in FavoritesService.toggleFavorite:', error)
      }

      // Si es un error de configuración de Supabase, simular comportamiento
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        // Simular que se agregó a favoritos (puedes cambiar esta lógica según necesites)
        return true
      }
      
      throw error
    }
  }
}
