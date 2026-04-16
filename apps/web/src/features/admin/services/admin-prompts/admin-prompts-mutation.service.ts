import { createClient } from '../../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../../lib/slug'
import {
  createAdminClient,
  promptsTable,
  usersTable,
  mapPromptRow,
  normalizeTags,
} from './admin-prompts-transform.service'
import type {
  AdminPrompt,
  AdminPromptWriteRow,
  PromptStatusRow,
  PromptFeaturedRow,
} from './admin-prompts-transform.service'

const PROMPT_RETURN_FIELDS = `
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
`

export async function createPrompt(
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

  const adminSupabase = createAdminClient()
  const now = new Date().toISOString()

  const payload: AdminPromptWriteRow = {
    title: promptData.title ?? '',
    slug,
    description: promptData.description ?? null,
    content: promptData.content ?? '',
    tags: normalizeTags(promptData.tags),
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
    .select(PROMPT_RETURN_FIELDS)
    .single()

  if (error || !data) {
    throw error ?? new Error('No se pudo crear el prompt')
  }

  return mapPromptRow(data)
}

export async function updatePrompt(
  promptId: string,
  promptData: Partial<AdminPrompt>
): Promise<AdminPrompt> {
  const supabase = await createClient()

  const updateData: Partial<AdminPromptWriteRow> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  }

  if (promptData.title !== undefined) updateData.title = promptData.title
  if (promptData.description !== undefined) updateData.description = promptData.description
  if (promptData.content !== undefined) updateData.content = promptData.content

  if (promptData.tags !== undefined) {
    updateData.tags = normalizeTags(promptData.tags)
  }

  if (promptData.difficulty_level !== undefined) {
    updateData.difficulty_level = promptData.difficulty_level
  }
  if (promptData.is_featured !== undefined) updateData.is_featured = promptData.is_featured
  if (promptData.is_verified !== undefined) updateData.is_verified = promptData.is_verified
  if (promptData.is_active !== undefined) updateData.is_active = promptData.is_active
  if (promptData.category_id !== undefined) updateData.category_id = promptData.category_id

  const { data, error } = await promptsTable(supabase)
    .update(updateData)
    .eq('prompt_id', promptId)
    .select(PROMPT_RETURN_FIELDS)
    .single()

  if (error || !data) {
    throw error ?? new Error('No se pudo actualizar el prompt')
  }

  return mapPromptRow(data)
}

export async function deletePrompt(promptId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await promptsTable(supabase)
    .delete()
    .eq('prompt_id', promptId)

  if (error) {
    throw error
  }
}

export async function togglePromptStatus(
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

export async function togglePromptFeatured(
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
