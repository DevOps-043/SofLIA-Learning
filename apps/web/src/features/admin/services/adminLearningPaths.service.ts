import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type {
  LearningPath,
  LearningPathItem,
  LearningPathUpsertPayload,
  OrganizationLearningPathAssignment,
  UserLearningPathAssignment,
} from '../types'

type LooseRow = Record<string, unknown>

interface LearningPathRow extends LooseRow {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

interface LearningPathItemRow extends LooseRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  courses?: {
    id: string
    title: string | null
    slug: string | null
    thumbnail_url: string | null
    category: string | null
    level: string | null
  } | null
}

interface OrganizationLearningPathAssignmentRow extends LooseRow {
  id: string
  organization_id: string
  learning_path_id: string
  assigned_at: string
  status: 'active' | 'revoked'
}

interface UserLearningPathAssignmentRow extends LooseRow {
  id: string
  organization_id: string
  user_id: string
  learning_path_id: string
  assigned_at: string
  status: 'assigned' | 'revoked'
  users?: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

function normalizeSlug(value: string | null | undefined) {
  if (!value) return null

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapLearningPathItems(rows: LearningPathItemRow[]): LearningPathItem[] {
  return rows
    .sort((left, right) => left.position - right.position)
    .map((row) => ({
      id: row.id,
      learning_path_id: row.learning_path_id,
      course_id: row.course_id,
      position: row.position,
      course: row.courses
        ? {
            id: row.courses.id,
            title: row.courses.title || 'Curso sin título',
            slug: row.courses.slug,
            thumbnail_url: row.courses.thumbnail_url,
            category: row.courses.category,
            level: row.courses.level,
          }
        : null,
    }))
}

async function loadItemsByPathIds(pathIds: string[]) {
  if (pathIds.length === 0) {
    return new Map<string, LearningPathItem[]>()
  }

  const supabase = await createClient()
  const { data, error } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
    .select(`
      id,
      learning_path_id,
      course_id,
      position,
      courses (
        id,
        title,
        slug,
        thumbnail_url,
        category,
        level
      )
    `)
    .in('learning_path_id', pathIds)
    .order('position', { ascending: true })

  if (error) {
    logger.error('Error loading learning path items:', error)
    throw new Error('No se pudieron cargar los ítems del learning path')
  }

  const itemsByPathId = new Map<string, LearningPathItem[]>()

  for (const row of data || []) {
    const existing = itemsByPathId.get(row.learning_path_id) || []
    existing.push(...mapLearningPathItems([row]))
    itemsByPathId.set(row.learning_path_id, existing)
  }

  return itemsByPathId
}

function mapLearningPaths(
  paths: LearningPathRow[],
  itemsByPathId: Map<string, LearningPathItem[]>,
): LearningPath[] {
  return paths.map((path) => {
    const items = itemsByPathId.get(path.id) || []

    return {
      id: path.id,
      title: path.title,
      slug: path.slug,
      description: path.description,
      is_active: Boolean(path.is_active),
      created_at: path.created_at,
      updated_at: path.updated_at,
      items,
      item_count: items.length,
    }
  })
}

async function ensureUniqueSlug(slug: string | null, currentPathId?: string) {
  if (!slug) return

  const supabase = await createClient()
  let query = fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .select('id, slug, title, description, is_active, created_at, updated_at')
    .eq('slug', slug)

  if (currentPathId) {
    query = query.neq('id', currentPathId)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Error validating learning path slug:', error)
    throw new Error('No se pudo validar el slug del learning path')
  }

  if ((data || []).length > 0) {
    throw new Error('Ya existe un learning path con ese slug')
  }
}

async function syncCourseAccessForOrganization(
  organizationId: string,
  courseIds: string[],
  adminUserId: string,
) {
  if (courseIds.length === 0) return

  const supabase = await createClient()

  for (const courseId of courseIds) {
    const existing = await fromLoose<LooseRow>(supabase, 'hierarchy_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing.error) {
      logger.error('Error checking hierarchy assignment for learning path:', existing.error)
      throw new Error('No se pudo sincronizar el acceso organizacional')
    }

    if (!existing.data) {
      const { error } = await fromLoose<LooseRow>(supabase, 'hierarchy_course_assignments')
        .insert({
          organization_id: organizationId,
          course_id: courseId,
          assigned_by: adminUserId,
          status: 'active',
        })

      if (error) {
        logger.error('Error creating hierarchy assignment for learning path:', error)
        throw new Error('No se pudo sincronizar el acceso organizacional')
      }
    }
  }
}

async function syncCourseAccessForUser(
  organizationId: string,
  userId: string,
  courseIds: string[],
  adminUserId: string,
) {
  if (courseIds.length === 0) return

  const supabase = await createClient()

  for (const courseId of courseIds) {
    const existing = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing.error) {
      logger.error('Error checking user course assignment for learning path:', existing.error)
      throw new Error('No se pudo sincronizar la asignación individual')
    }

    if (!existing.data) {
      const assignmentInsert = await supabase
        .from('organization_course_assignments')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          course_id: courseId,
          assigned_by: adminUserId,
          status: 'assigned',
        })

      if (assignmentInsert.error) {
        logger.error('Error creating user course assignment for learning path:', assignmentInsert.error)
        throw new Error('No se pudo sincronizar la asignación individual')
      }
    }

    const enrollmentInsert = await supabase
      .from('user_course_enrollments')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          organization_id: organizationId,
          enrollment_status: 'active',
          enrolled_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true },
      )

    if (enrollmentInsert.error) {
      logger.error('Error upserting user enrollment for learning path:', enrollmentInsert.error)
      throw new Error('No se pudo sincronizar el acceso del usuario')
    }
  }
}

export class AdminLearningPathsService {
  static async listLearningPaths(): Promise<LearningPath[]> {
    const supabase = await createClient()
    const { data, error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
      .select('id, title, slug, description, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching learning paths:', error)
      throw new Error('No se pudieron cargar los learning paths')
    }

    const paths = data || []
    const itemsByPathId = await loadItemsByPathIds(paths.map((path) => path.id))
    return mapLearningPaths(paths, itemsByPathId)
  }

  static async getLearningPathById(id: string): Promise<LearningPath | null> {
    const supabase = await createClient()
    const { data, error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
      .select('id, title, slug, description, is_active, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching learning path by id:', error)
      throw new Error('No se pudo cargar el learning path')
    }

    if (!data) return null

    const itemsByPathId = await loadItemsByPathIds([id])
    return mapLearningPaths([data], itemsByPathId)[0] || null
  }

  static async createLearningPath(
    payload: LearningPathUpsertPayload,
    adminUserId: string,
  ): Promise<LearningPath> {
    const title = payload.title?.trim()

    if (!title) {
      throw new Error('El título del learning path es requerido')
    }

    const slug = normalizeSlug(payload.slug || title)
    await ensureUniqueSlug(slug)

    const supabase = await createClient()
    const { data, error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
      .insert({
        title,
        slug,
        description: payload.description?.trim() || null,
        is_active: payload.is_active ?? true,
        created_by: adminUserId,
      })
      .select('id, title, slug, description, is_active, created_at, updated_at')
      .single()

    if (error || !data) {
      logger.error('Error creating learning path:', error)
      throw new Error('No se pudo crear el learning path')
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      is_active: Boolean(data.is_active),
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: [],
      item_count: 0,
    }
  }

  static async updateLearningPath(
    id: string,
    payload: Partial<LearningPathUpsertPayload>,
  ): Promise<LearningPath> {
    const existing = await this.getLearningPathById(id)
    if (!existing) {
      throw new Error('Learning path no encontrado')
    }

    const nextTitle = payload.title?.trim() || existing.title
    const nextSlug = normalizeSlug(payload.slug ?? existing.slug ?? nextTitle)
    await ensureUniqueSlug(nextSlug, id)

    const supabase = await createClient()
    const { error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
      .update({
        title: nextTitle,
        slug: nextSlug,
        description: payload.description !== undefined ? payload.description?.trim() || null : existing.description,
        is_active: payload.is_active ?? existing.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error('Error updating learning path:', error)
      throw new Error('No se pudo actualizar el learning path')
    }

    const refreshed = await this.getLearningPathById(id)
    if (!refreshed) {
      throw new Error('No se pudo recargar el learning path actualizado')
    }

    return refreshed
  }

  static async deleteLearningPath(id: string) {
    const supabase = await createClient()
    const { error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting learning path:', error)
      throw new Error('No se pudo eliminar el learning path')
    }
  }

  static async addItem(
    learningPathId: string,
    courseId: string,
  ): Promise<LearningPathItem> {
    const currentPath = await this.getLearningPathById(learningPathId)
    if (!currentPath) {
      throw new Error('Learning path no encontrado')
    }

    if (currentPath.items.some((item) => item.course_id === courseId)) {
      throw new Error('Ese taller ya existe dentro del learning path')
    }

    const supabase = await createClient()
    const nextPosition = currentPath.items.length + 1

    const { data, error } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
      .insert({
        learning_path_id: learningPathId,
        course_id: courseId,
        position: nextPosition,
      })
      .select(`
        id,
        learning_path_id,
        course_id,
        position,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          category,
          level
        )
      `)
      .single()

    if (error || !data) {
      logger.error('Error adding learning path item:', error)
      throw new Error('No se pudo agregar el taller al learning path')
    }

    return mapLearningPathItems([data])[0]
  }

  static async removeItem(learningPathId: string, itemId: string) {
    const supabase = await createClient()
    const { data: item, error: itemError } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
      .select('id, learning_path_id, course_id, position')
      .eq('learning_path_id', learningPathId)
      .eq('id', itemId)
      .maybeSingle()

    if (itemError) {
      logger.error('Error loading learning path item:', itemError)
      throw new Error('No se pudo cargar el ítem del learning path')
    }

    if (!item) {
      throw new Error('Ítem del learning path no encontrado')
    }

    const { error } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      logger.error('Error removing learning path item:', error)
      throw new Error('No se pudo eliminar el ítem del learning path')
    }

    const { data: remaining, error: remainingError } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
      .select('id, learning_path_id, course_id, position')
      .eq('learning_path_id', learningPathId)
      .order('position', { ascending: true })

    if (remainingError) {
      logger.error('Error reloading remaining learning path items:', remainingError)
      throw new Error('No se pudo reordenar el learning path')
    }

    for (const [index, row] of (remaining || []).entries()) {
      const expectedPosition = index + 1
      if (row.position === expectedPosition) continue

      const updateResult = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
        .update({
          position: expectedPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      if (updateResult.error) {
        logger.error('Error compacting learning path positions:', updateResult.error)
        throw new Error('No se pudo reordenar el learning path')
      }
    }
  }

  static async reorderItems(
    learningPathId: string,
    orderedItemIds: string[],
  ): Promise<LearningPath> {
    const currentPath = await this.getLearningPathById(learningPathId)
    if (!currentPath) {
      throw new Error('Learning path no encontrado')
    }

    if (orderedItemIds.length !== currentPath.items.length) {
      throw new Error('El nuevo orden no coincide con los ítems actuales')
    }

    const currentItemIds = new Set(currentPath.items.map((item) => item.id))
    const requestedItemIds = new Set(orderedItemIds)

    if (currentItemIds.size !== requestedItemIds.size) {
      throw new Error('El nuevo orden contiene elementos duplicados')
    }

    for (const itemId of orderedItemIds) {
      if (!currentItemIds.has(itemId)) {
        throw new Error('El nuevo orden contiene ítems inválidos')
      }
    }

    const supabase = await createClient()

    for (const [index, itemId] of orderedItemIds.entries()) {
      const stagingResult = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
        .update({
          position: 1000 + index,
          updated_at: new Date().toISOString(),
        })
        .eq('learning_path_id', learningPathId)
        .eq('id', itemId)

      if (stagingResult.error) {
        logger.error('Error staging learning path reorder:', stagingResult.error)
        throw new Error('No se pudo preparar el reordenamiento del learning path')
      }
    }

    for (const [index, itemId] of orderedItemIds.entries()) {
      const updateResult = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
        .update({
          position: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('learning_path_id', learningPathId)
        .eq('id', itemId)

      if (updateResult.error) {
        logger.error('Error reordering learning path items:', updateResult.error)
        throw new Error('No se pudo reordenar el learning path')
      }
    }

    const refreshed = await this.getLearningPathById(learningPathId)
    if (!refreshed) {
      throw new Error('No se pudo recargar el learning path')
    }

    return refreshed
  }

  static async listOrganizationAssignments(
    organizationId: string,
  ): Promise<OrganizationLearningPathAssignment[]> {
    const supabase = await createClient()
    const { data, error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .select('id, organization_id, learning_path_id, assigned_at, status')
      .eq('organization_id', organizationId)
      .order('assigned_at', { ascending: false })

    if (error) {
      logger.error('Error fetching organization learning path assignments:', error)
      throw new Error('No se pudieron cargar las asignaciones organizacionales')
    }

    const rows = data || []
    const learningPaths = await this.listLearningPaths()
    const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))

    return rows.map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      learning_path_id: row.learning_path_id,
      assigned_at: row.assigned_at,
      status: row.status,
      learning_path: learningPathMap.get(row.learning_path_id) || null,
    }))
  }

  static async assignToOrganization(
    organizationId: string,
    learningPathId: string,
    adminUserId: string,
  ): Promise<OrganizationLearningPathAssignment> {
    const path = await this.getLearningPathById(learningPathId)
    if (!path) {
      throw new Error('Learning path no encontrado')
    }

    await syncCourseAccessForOrganization(
      organizationId,
      path.items.map((item) => item.course_id),
      adminUserId,
    )

    const supabase = await createClient()
    const existing = await fromLoose<OrganizationLearningPathAssignmentRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .select('id, organization_id, learning_path_id, assigned_at, status')
      .eq('organization_id', organizationId)
      .eq('learning_path_id', learningPathId)
      .maybeSingle()

    if (existing.error) {
      logger.error('Error checking organization learning path assignment:', existing.error)
      throw new Error('No se pudo asignar el learning path')
    }

    if (existing.data) {
      if (existing.data.status !== 'active') {
        const reactivated = await fromLoose<OrganizationLearningPathAssignmentRow>(
          supabase,
          'organization_learning_path_assignments',
        )
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id)

        if (reactivated.error) {
          logger.error('Error reactivating organization learning path assignment:', reactivated.error)
          throw new Error('No se pudo reactivar la asignación del learning path')
        }
      }

      return {
        id: existing.data.id,
        organization_id: existing.data.organization_id,
        learning_path_id: existing.data.learning_path_id,
        assigned_at: existing.data.assigned_at,
        status: 'active',
        learning_path: path,
      }
    }

    const { data, error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .insert({
        organization_id: organizationId,
        learning_path_id: learningPathId,
        assigned_by: adminUserId,
        status: 'active',
      })
      .select('id, organization_id, learning_path_id, assigned_at, status')
      .single()

    if (error || !data) {
      logger.error('Error assigning learning path to organization:', error)
      throw new Error('No se pudo asignar el learning path')
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      learning_path_id: data.learning_path_id,
      assigned_at: data.assigned_at,
      status: data.status,
      learning_path: path,
    }
  }

  static async revokeFromOrganization(organizationId: string, assignmentId: string) {
    const supabase = await createClient()
    const { error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('id', assignmentId)

    if (error) {
      logger.error('Error revoking organization learning path assignment:', error)
      throw new Error('No se pudo revocar el learning path')
    }
  }

  static async listUserAssignments(
    organizationId: string,
  ): Promise<UserLearningPathAssignment[]> {
    const supabase = await createClient()
    const { data, error } = await fromLoose<UserLearningPathAssignmentRow>(
      supabase,
      'user_learning_path_assignments',
    )
      .select(`
        id,
        organization_id,
        user_id,
        learning_path_id,
        assigned_at,
        status,
        users:user_id (
          id,
          email,
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .order('assigned_at', { ascending: false })

    if (error) {
      logger.error('Error fetching user learning path assignments:', error)
      throw new Error('No se pudieron cargar las asignaciones individuales')
    }

    const rows = data || []
    const learningPaths = await this.listLearningPaths()
    const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))

    return rows.map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      user_id: row.user_id,
      learning_path_id: row.learning_path_id,
      assigned_at: row.assigned_at,
      status: row.status,
      learning_path: learningPathMap.get(row.learning_path_id) || null,
      user: row.users || null,
    }))
  }

  static async assignToUser(
    organizationId: string,
    userId: string,
    learningPathId: string,
    adminUserId: string,
  ): Promise<UserLearningPathAssignment> {
    const path = await this.getLearningPathById(learningPathId)
    if (!path) {
      throw new Error('Learning path no encontrado')
    }

    await syncCourseAccessForOrganization(
      organizationId,
      path.items.map((item) => item.course_id),
      adminUserId,
    )
    await syncCourseAccessForUser(
      organizationId,
      userId,
      path.items.map((item) => item.course_id),
      adminUserId,
    )

    const supabase = await createClient()
    const existing = await fromLoose<UserLearningPathAssignmentRow>(
      supabase,
      'user_learning_path_assignments',
    )
      .select(`
        id,
        organization_id,
        user_id,
        learning_path_id,
        assigned_at,
        status,
        users:user_id (
          id,
          email,
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('learning_path_id', learningPathId)
      .maybeSingle()

    if (existing.error) {
      logger.error('Error checking user learning path assignment:', existing.error)
      throw new Error('No se pudo asignar el learning path al usuario')
    }

    if (existing.data) {
      if (existing.data.status !== 'assigned') {
        const reactivated = await fromLoose<UserLearningPathAssignmentRow>(
          supabase,
          'user_learning_path_assignments',
        )
          .update({
            status: 'assigned',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id)

        if (reactivated.error) {
          logger.error('Error reactivating user learning path assignment:', reactivated.error)
          throw new Error('No se pudo reactivar la asignación del learning path')
        }
      }

      return {
        id: existing.data.id,
        organization_id: existing.data.organization_id,
        user_id: existing.data.user_id,
        learning_path_id: existing.data.learning_path_id,
        assigned_at: existing.data.assigned_at,
        status: 'assigned',
        learning_path: path,
        user: existing.data.users || null,
      }
    }

    const { data, error } = await fromLoose<UserLearningPathAssignmentRow>(
      supabase,
      'user_learning_path_assignments',
    )
      .insert({
        organization_id: organizationId,
        user_id: userId,
        learning_path_id: learningPathId,
        assigned_by: adminUserId,
        status: 'assigned',
      })
      .select(`
        id,
        organization_id,
        user_id,
        learning_path_id,
        assigned_at,
        status,
        users:user_id (
          id,
          email,
          display_name,
          first_name,
          last_name
        )
      `)
      .single()

    if (error || !data) {
      logger.error('Error assigning learning path to user:', error)
      throw new Error('No se pudo asignar el learning path al usuario')
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      user_id: data.user_id,
      learning_path_id: data.learning_path_id,
      assigned_at: data.assigned_at,
      status: data.status,
      learning_path: path,
      user: data.users || null,
    }
  }

  static async revokeFromUser(
    organizationId: string,
    assignmentId: string,
  ) {
    const supabase = await createClient()
    const { error } = await fromLoose<UserLearningPathAssignmentRow>(
      supabase,
      'user_learning_path_assignments',
    )
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('id', assignmentId)

    if (error) {
      logger.error('Error revoking user learning path assignment:', error)
      throw new Error('No se pudo revocar la asignación individual')
    }
  }
}
