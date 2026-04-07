import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../../lib/supabase/types'
import { fromLoose } from '../../../../lib/supabase/looseQuery'

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── Internal row types ───────────────────────────────────────────────────────

export interface AdminPromptCategoryRow {
  category_id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
}

export interface AdminPromptAuthorRow {
  id: string
  first_name: string
  last_name: string
  display_name: string
  email: string
}

export interface AdminPromptRow {
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

export interface AdminPromptWriteRow {
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

export interface PromptStatsRow {
  download_count: number | null
  like_count: number | null
  rating: number | null
  rating_count: number | null
  view_count: number | null
}

export interface PromptStatusRow {
  is_active: boolean
  prompt_id: string
  title: string
}

export interface PromptFeaturedRow {
  is_featured: boolean
  prompt_id: string
  title: string
}

// ─── Supabase client factory ──────────────────────────────────────────────────

export function createAdminClient() {
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

// ─── Table accessors ──────────────────────────────────────────────────────────

export function promptsTable(client: unknown) {
  return fromLoose<AdminPromptRow, AdminPromptWriteRow>(client, 'ai_prompts')
}

export function categoriesTable(client: unknown) {
  return fromLoose<AdminCategory>(client, 'ai_categories')
}

export function usersTable(client: unknown) {
  return fromLoose<AdminPromptAuthorRow>(client, 'users')
}

// ─── Data mapping ─────────────────────────────────────────────────────────────

export function mapPromptRow(
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

// ─── Tag normalization helper ─────────────────────────────────────────────────

export function normalizeTags(tags: string[] | string | null | undefined): string[] {
  if (!tags) return []
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }
  return tags.filter(
    (tag): tag is string => typeof tag === 'string' && tag.trim().length > 0
  )
}
