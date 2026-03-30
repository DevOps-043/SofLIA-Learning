import { createClient } from '../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase/types'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../lib/slug'

export interface AdminPrompt {
  prompt_id: string
  title: string
  slug: string
  description: string
  content: string
  tags: string[] | string | null
  difficulty_level: string
  estimated_time_min?: number // Hacer opcional ya que puede no existir
  use_cases?: string // Hacer opcional
  tips?: string // Hacer opcional
  is_featured: boolean
  is_verified: boolean
  view_count: number
  like_count: number
  download_count: number
  rating: number
  rating_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  category_id: string
  author_id: string
  // Relaciones
  category?: {
    category_id: string
    name: string
    slug: string
    description: string
    icon: string
    color: string
  }
  author?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
  }
}

export interface AdminCategory {
  category_id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromptStats {
  totalPrompts: number
  activePrompts: number
  featuredPrompts: number
  totalLikes: number
  totalViews: number
  totalDownloads: number
  averageRating: number
}

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export class AdminPromptsService {
  static async getPrompts(): Promise<AdminPrompt[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select(`
          prompt_id,
          title,
          slug,
          description,
          content,
          tags,
          difficulty_level,
          is_featured,
          is_verified,
          view_count,
          like_count,
          download_count,
          rating,
          rating_count,
          is_active,
          created_at,
          updated_at,
          category_id,
          author_id,
          ai_categories!inner(
            category_id,
            name,
            slug,
            description,
            icon,
            color
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Obtener información de autores
      const promptsWithAuthors = await Promise.all(
        (data || []).map(async (prompt) => {
          let authorInfo = null
          
          if (prompt.author_id) {
            const { data: author } = await supabase
              .from('users')
              .select('id, first_name, last_name, display_name, email')
              .eq('id', prompt.author_id)
              .single()
            
            if (author) {
              authorInfo = author
            }
          }

          return {
            ...prompt,
            category: prompt.ai_categories,
            author: authorInfo
          }
        })
      )

      return promptsWithAuthors
    } catch (error) {
      throw error
    }
  }

  static async getCategories(): Promise<AdminCategory[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('ai_categories')
        .select(`
          category_id,
          name,
          slug,
          description,
          icon,
          color,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  static async getPromptStats(): Promise<PromptStats> {
    const supabase = await createClient()

    try {
      // Obtener estadísticas básicas
      const { count: totalPrompts, error: totalError } = await supabase
        .from('ai_prompts')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        console.error('❌ Error fetching total prompts count:', totalError)
        throw totalError
      }

      const { count: activePrompts, error: activeError } = await supabase
        .from('ai_prompts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (activeError) {
        console.error('❌ Error fetching active prompts count:', activeError)
        throw activeError
      }

      const { count: featuredPrompts, error: featuredError } = await supabase
        .from('ai_prompts')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true)

      if (featuredError) {
        console.error('❌ Error fetching featured prompts count:', featuredError)
        throw featuredError
      }

      // Obtener estadísticas agregadas
      const { data: statsData, error: statsError } = await supabase
        .from('ai_prompts')
        .select('like_count, view_count, download_count, rating, rating_count')
        .eq('is_active', true)

      if (statsError) {
        console.error('❌ Error fetching prompts stats:', statsError)
        throw statsError
      }

      const stats = statsData || []
      const totalLikes = stats.reduce((sum, prompt) => sum + (prompt.like_count || 0), 0)
      const totalViews = stats.reduce((sum, prompt) => sum + (prompt.view_count || 0), 0)
      const totalDownloads = stats.reduce((sum, prompt) => sum + (prompt.download_count || 0), 0)
      
      const validRatings = stats.filter(p => p.rating && p.rating > 0)
      const averageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, prompt) => sum + (prompt.rating || 0), 0) / validRatings.length
        : 0

      const result = {
        totalPrompts: totalPrompts || 0,
        activePrompts: activePrompts || 0,
        featuredPrompts: featuredPrompts || 0,
        totalLikes,
        totalViews,
        totalDownloads,
        averageRating: Math.round(averageRating * 10) / 10
      }

      return result
    } catch (error) {
      throw error
    }
  }

  static async createPrompt(promptData: Partial<AdminPrompt>, adminUserId: string): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      // ✅ SEGURIDAD: Sanitizar y generar slug único
      let slug: string;
      
      if (promptData.slug) {
        slug = sanitizeSlug(promptData.slug);
      } else if (promptData.title) {
        slug = sanitizeSlug(promptData.title);
      } else {
        throw new Error('Se requiere título o slug para crear el prompt');
      }

      // Verificar unicidad
      slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
        const { data } = await supabase
          .from('ai_prompts')
          .select('slug')
          .eq('slug', testSlug)
          .single();
        return !!data;
      });
      
      // ✅ SEGURIDAD: Siempre usar el adminUserId autenticado, no confiar en promptData.author_id
      // Verificar que el adminUserId existe en la base de datos
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', adminUserId)
        .single()

      if (userCheckError || !userCheck) {
        throw new Error(`El usuario autenticado no existe en la base de datos: ${adminUserId}`)
      }

      // Procesar tags correctamente
      let processedTags: string[] = []
      if (promptData.tags) {
        if (typeof promptData.tags === 'string') {
          processedTags = promptData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        } else if (Array.isArray(promptData.tags)) {
          processedTags = promptData.tags.filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
        }
      }

      // ✅ SEGURIDAD: Usar cliente admin con service role key para bypass RLS en la inserción
      const adminSupabase = createAdminClient()

      const { data, error } = await adminSupabase
        .from('ai_prompts')
        .insert({
          title: promptData.title,
          slug,
          description: promptData.description || null,
          content: promptData.content,
          tags: processedTags.length > 0 ? processedTags : [],
          difficulty_level: promptData.difficulty_level || 'beginner',
          is_featured: promptData.is_featured || false,
          is_verified: promptData.is_verified || false,
          view_count: 0,
          like_count: 0,
          download_count: 0,
          rating: 0,
          rating_count: 0,
          is_active: promptData.is_active !== undefined ? promptData.is_active : true,
          category_id: promptData.category_id || null,
          author_id: adminUserId, // ✅ SIEMPRE usar el adminUserId autenticado
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          prompt_id,
          title,
          slug,
          description,
          content,
          tags,
          difficulty_level,
          is_featured,
          is_verified,
          view_count,
          like_count,
          download_count,
          rating,
          rating_count,
          is_active,
          created_at,
          updated_at,
          category_id,
          author_id
        `)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async updatePrompt(promptId: string, promptData: Partial<AdminPrompt>): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      // Solo incluir campos que sabemos que existen en la BD
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Campos básicos que sabemos que existen
      if (promptData.title !== undefined) updateData.title = promptData.title
      if (promptData.description !== undefined) updateData.description = promptData.description
      if (promptData.content !== undefined) updateData.content = promptData.content
      
      // Manejar tags como array si es necesario
      if (promptData.tags !== undefined) {
        if (promptData.tags && typeof promptData.tags === 'string' && promptData.tags.trim()) {
          // Convertir string a array
          updateData.tags = promptData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        } else {
          // Array vacío para tags vacíos
          updateData.tags = []
        }
      }
      
      if (promptData.difficulty_level !== undefined) updateData.difficulty_level = promptData.difficulty_level
      if (promptData.is_featured !== undefined) updateData.is_featured = promptData.is_featured
      if (promptData.is_verified !== undefined) updateData.is_verified = promptData.is_verified
      if (promptData.is_active !== undefined) updateData.is_active = promptData.is_active
      if (promptData.category_id !== undefined) updateData.category_id = promptData.category_id

      const { data, error } = await supabase
        .from('ai_prompts')
        .update(updateData)
        .eq('prompt_id', promptId)
        .select(`
          prompt_id,
          title,
          slug,
          description,
          content,
          tags,
          difficulty_level,
          is_featured,
          is_verified,
          view_count,
          like_count,
          download_count,
          rating,
          rating_count,
          is_active,
          created_at,
          updated_at,
          category_id,
          author_id
        `)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async deletePrompt(promptId: string): Promise<void> {
    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('ai_prompts')
        .delete()
        .eq('prompt_id', promptId)

      if (error) {
        throw error
      }

      } catch (error) {
      throw error
    }
  }

  static async togglePromptStatus(promptId: string, isActive: boolean): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('prompt_id', promptId)
        .select(`
          prompt_id,
          title,
          is_active
        `)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async togglePromptFeatured(promptId: string, isFeatured: boolean): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .update({ 
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('prompt_id', promptId)
        .select(`
          prompt_id,
          title,
          is_featured
        `)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }
}
