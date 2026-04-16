import { createClient } from '../../../../lib/supabase/server'
import {
  promptsTable,
  categoriesTable,
  usersTable,
  mapPromptRow,
} from './admin-prompts-transform.service'
import type {
  AdminPrompt,
  AdminCategory,
  AdminPromptRow,
  AdminPromptAuthorRow,
  PromptStats,
  PromptStatsRow,
} from './admin-prompts-transform.service'

const PROMPT_SELECT_FIELDS = `
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
`

export async function getPrompts(): Promise<AdminPrompt[]> {
  const supabase = await createClient()

  const { data, error } = await promptsTable(supabase)
    .select(PROMPT_SELECT_FIELDS)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const promptRows = (data ?? []) as AdminPromptRow[]
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

    authorsById = new Map(
      ((authors ?? []) as AdminPromptAuthorRow[]).map((author) => [author.id, author])
    )
  }

  return promptRows.map((prompt) =>
    mapPromptRow(
      prompt,
      prompt.author_id ? authorsById.get(prompt.author_id) : undefined
    )
  )
}

export async function getCategories(): Promise<AdminCategory[]> {
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

  return (data ?? []) as AdminCategory[]
}

export async function getPromptStats(): Promise<PromptStats> {
  const supabase = await createClient()

  const [
    { count: totalPrompts, error: totalError },
    { count: activePrompts, error: activeError },
    { count: featuredPrompts, error: featuredError },
    { data: statsData, error: statsError },
  ] = await Promise.all([
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
  const totalDownloads = stats.reduce(
    (sum, prompt) => sum + (prompt.download_count ?? 0),
    0
  )

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
