import { createClient } from '../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase/types'
import { fromLoose } from '../../../lib/supabase/looseQuery'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../lib/slug'

export interface AdminPrompt {
  prompt_id: string
  title: string
  slug: string
  description: string
  content: string
  tags: string[] | string | null
  difficulty_level: string
  estimated_time_min?: number
  use_cases?: string
  tips?: string
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

interface AdminPromptCategoryRow {
  category_id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
}

interface AdminPromptAuthorRow {
  id: string
  first_name: string
  last_name: string
  display_name: string
  email: string
}

interface AdminPromptRow {
  prompt_id: string
  title: string
  slug: string
  description: string | null
  content: string
  tags: string[] | string | null
  difficulty_level: string
  estimated_time_min?: number | null
  use_cases?: string | null
  tips?: string | null
  is_featured: boolean
  is_verified: boolean
  view_count: number | null
  like_count: number | null
  download_count: number | null
  rating: number | null
  rating_count: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  category_id: string | null
  author_id: string | null
  ai_categories?: AdminPromptCategoryRow | null
}

interface AdminPromptWriteRow {
  title: string
  slug: string
  description: string | null
  content: string
  tags: string[]
  difficulty_level: string
  is_featured: boolean
  is_verified: boolean
  view_count: number
  like_count: number
  download_count: number
  rating: number
  rating_count: number
  is_active: boolean
  category_id: string | null
  author_id: string
  created_at: string
  updated_at: string
}

interface PromptStatsRow {
  download_count: number | null
  like_count: number | null
  rating: number | null
  rating_count: number | null
  view_count: number | null
}

interface PromptStatusRow {
  is_active: boolean
  prompt_id: string
  title: string
}

interface PromptFeaturedRow {
  is_featured: boolean
  prompt_id: string
  title: string
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no esta configurada')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function promptsTable(client: unknown) {
  return fromLoose<AdminPromptRow, AdminPromptWriteRow>(client, 'ai_prompts')
}

function categoriesTable(client: unknown) {
  return fromLoose<AdminCategory>(client, 'ai_categories')
}

function usersTable(client: unknown) {
  return fromLoose<AdminPromptAuthorRow>(client, 'users')
}

function mapPromptRow(
  prompt: AdminPromptRow,
  author?: AdminPromptAuthorRow
): AdminPrompt {
  return {
    prompt_id: prompt.prompt_id,
    title: prompt.title,
    slug: prompt.slug,
    description: prompt.description ?? '',
    content: prompt.content,
    tags: prompt.tags,
    difficulty_level: prompt.difficulty_level,
    estimated_time_min: prompt.estimated_time_min ?? undefined,
    use_cases: prompt.use_cases ?? undefined,
    tips: prompt.tips ?? undefined,
    is_featured: prompt.is_featured,
    is_verified: prompt.is_verified,
    view_count: prompt.view_count ?? 0,
    like_count: prompt.like_count ?? 0,
    download_count: prompt.download_count ?? 0,
    rating: prompt.rating ?? 0,
    rating_count: prompt.rating_count ?? 0,
    is_active: prompt.is_active,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
    category_id: prompt.category_id ?? '',
    author_id: prompt.author_id ?? '',
    category: prompt.ai_categories ?? undefined,
    author,
  }
}

export class AdminPromptsService {
  static async getPrompts(): Promise<AdminPrompt[]> {
    const supabase = await createClient()

    const { data, error } = await promptsTable(supabase)
      .select(`
        prompt_id,
        title,
        slug,
        description,
        content,
        tags,
        difficulty_level,
        estimated_time_min,
        use_cases,
        tips,
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
        ai_categories(
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

    const promptRows = data ?? []
    const authorIds = Array.from(
      new Set(
        promptRows
          .map((prompt) => prompt.author_id)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    )

    let authorsById = new Map<string, AdminPromptAuthorRow>()

    if (authorIds.length > 0) {
      const { data: authors, error: authorsError } = await usersTable(supabase)
        .select('id, first_name, last_name, display_name, email')
        .in('id', authorIds)

      if (authorsError) {
        throw authorsError
      }

      authorsById = new Map((authors ?? []).map((author) => [author.id, author]))
    }

    return promptRows.map((prompt) =>
      mapPromptRow(
        prompt,
        prompt.author_id ? authorsById.get(prompt.author_id) : undefined
      )
    )
  }

  static async getCategories(): Promise<AdminCategory[]> {
    const supabase = await createClient()

    const { data, error } = await categoriesTable(supabase)
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

    return data ?? []
  }

  static async getPromptStats(): Promise<PromptStats> {
    const supabase = await createClient()

    const [{ count: totalPrompts, error: totalError }, { count: activePrompts, error: activeError }, { count: featuredPrompts, error: featuredError }, { data: statsData, error: statsError }] =
      await Promise.all([
        promptsTable(supabase).select('prompt_id', { count: 'exact', head: true }),
        promptsTable(supabase)
          .select('prompt_id', { count: 'exact', head: true })
          .eq('is_active', true),
        promptsTable(supabase)
          .select('prompt_id', { count: 'exact', head: true })
          .eq('is_featured', true),
        promptsTable(supabase)
          .select('like_count, view_count, download_count, rating, rating_count')
          .eq('is_active', true),
      ])

    if (totalError) throw totalError
    if (activeError) throw activeError
    if (featuredError) throw featuredError
    if (statsError) throw statsError

    const stats = (statsData ?? []) as PromptStatsRow[]
    const totalLikes = stats.reduce((sum, prompt) => sum + (prompt.like_count ?? 0), 0)
    const totalViews = stats.reduce((sum, prompt) => sum + (prompt.view_count ?? 0), 0)
    const totalDownloads = stats.reduce((sum, prompt) => sum + (prompt.download_count ?? 0), 0)

    const validRatings = stats.filter((prompt) => (prompt.rating ?? 0) > 0)
    const averageRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, prompt) => sum + (prompt.rating ?? 0), 0) /
          validRatings.length
        : 0

    return {
      totalPrompts: totalPrompts ?? 0,
      activePrompts: activePrompts ?? 0,
      featuredPrompts: featuredPrompts ?? 0,
      totalLikes,
      totalViews,
      totalDownloads,
      averageRating: Math.round(averageRating * 10) / 10,
    }
  }

  static async createPrompt(
    promptData: Partial<AdminPrompt>,
    adminUserId: string
  ): Promise<AdminPrompt> {
    const supabase = await createClient()

    let slug: string

    if (promptData.slug) {
      slug = sanitizeSlug(promptData.slug)
    } else if (promptData.title) {
      slug = sanitizeSlug(promptData.title)
    } else {
      throw new Error('Se requiere titulo o slug para crear el prompt')
    }

    slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
      const { data } = await promptsTable(supabase)
        .select('slug')
        .eq('slug', testSlug)
        .single()
      return !!data
    })

    const { data: userCheck, error: userCheckError } = await usersTable(supabase)
      .select('id')
      .eq('id', adminUserId)
      .single()

    if (userCheckError || !userCheck) {
      throw new Error(
        `El usuario autenticado no existe en la base de datos: ${adminUserId}`
      )
    }

    let processedTags: string[] = []
    if (promptData.tags) {
      if (typeof promptData.tags === 'string') {
        processedTags = promptData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      } else if (Array.isArray(promptData.tags)) {
        processedTags = promptData.tags.filter(
          (tag): tag is string => typeof tag === 'string' && tag.trim().length > 0
        )
      }
    }

    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    const payload: AdminPromptWriteRow = {
      title: promptData.title ?? '',
      slug,
      description: promptData.description ?? null,
      content: promptData.content ?? '',
      tags: processedTags,
      difficulty_level: promptData.difficulty_level ?? 'beginner',
      is_featured: promptData.is_featured ?? false,
      is_verified: promptData.is_verified ?? false,
      view_count: 0,
      like_count: 0,
      download_count: 0,
      rating: 0,
      rating_count: 0,
      is_active: promptData.is_active ?? true,
      category_id: promptData.category_id ?? null,
      author_id: adminUserId,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await promptsTable(adminSupabase)
      .insert(payload)
      .select(`
        prompt_id,
        title,
        slug,
        description,
        content,
        tags,
        difficulty_level,
        estimated_time_min,
        use_cases,
        tips,
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

    if (error || !data) {
      throw error ?? new Error('No se pudo crear el prompt')
    }

    return mapPromptRow(data)
  }

  static async updatePrompt(
    promptId: string,
    promptData: Partial<AdminPrompt>
  ): Promise<AdminPrompt> {
    const supabase = await createClient()

    const updateData: Partial<AdminPromptWriteRow> & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    }

    if (promptData.title !== undefined) updateData.title = promptData.title
    if (promptData.description !== undefined) {
      updateData.description = promptData.description
    }
    if (promptData.content !== undefined) updateData.content = promptData.content

    if (promptData.tags !== undefined) {
      if (typeof promptData.tags === 'string' && promptData.tags.trim()) {
        updateData.tags = promptData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      } else if (Array.isArray(promptData.tags)) {
        updateData.tags = promptData.tags.filter(
          (tag): tag is string => typeof tag === 'string' && tag.trim().length > 0
        )
      } else {
        updateData.tags = []
      }
    }

    if (promptData.difficulty_level !== undefined) {
      updateData.difficulty_level = promptData.difficulty_level
    }
    if (promptData.is_featured !== undefined) {
      updateData.is_featured = promptData.is_featured
    }
    if (promptData.is_verified !== undefined) {
      updateData.is_verified = promptData.is_verified
    }
    if (promptData.is_active !== undefined) {
      updateData.is_active = promptData.is_active
    }
    if (promptData.category_id !== undefined) {
      updateData.category_id = promptData.category_id
    }

    const { data, error } = await promptsTable(supabase)
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
        estimated_time_min,
        use_cases,
        tips,
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

    if (error || !data) {
      throw error ?? new Error('No se pudo actualizar el prompt')
    }

    return mapPromptRow(data)
  }

  static async deletePrompt(promptId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await promptsTable(supabase)
      .delete()
      .eq('prompt_id', promptId)

    if (error) {
      throw error
    }
  }

  static async togglePromptStatus(
    promptId: string,
    isActive: boolean
  ): Promise<Pick<AdminPrompt, 'prompt_id' | 'title' | 'is_active'>> {
    const supabase = await createClient()

    const { data, error } = await promptsTable(supabase)
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('prompt_id', promptId)
      .select('prompt_id, title, is_active')
      .single()

    if (error || !data) {
      throw error ?? new Error('No se pudo actualizar el estado del prompt')
    }

    const prompt = data as PromptStatusRow
    return {
      prompt_id: prompt.prompt_id,
      title: prompt.title,
      is_active: prompt.is_active,
    }
  }

  static async togglePromptFeatured(
    promptId: string,
    isFeatured: boolean
  ): Promise<Pick<AdminPrompt, 'prompt_id' | 'title' | 'is_featured'>> {
    const supabase = await createClient()

    const { data, error } = await promptsTable(supabase)
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('prompt_id', promptId)
      .select('prompt_id, title, is_featured')
      .single()

    if (error || !data) {
      throw error ?? new Error('No se pudo actualizar el destacado del prompt')
    }

    const prompt = data as PromptFeaturedRow
    return {
      prompt_id: prompt.prompt_id,
      title: prompt.title,
      is_featured: prompt.is_featured,
    }
  }
}
