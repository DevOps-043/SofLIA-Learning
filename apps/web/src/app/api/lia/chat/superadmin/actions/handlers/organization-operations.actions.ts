import { z } from 'zod'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'
import { getOrganizationAnalyticsDailyReport } from '@/features/business-panel/services/reports-analytics/org-analytics-daily-report.server.service'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import {
  EntityNotFoundError,
  resolveOrganizationMember,
  resolveTargetCourse,
  resolveTargetLearningPath,
  resolveTargetOrganization,
} from '../entity-resolution'
import { defineAction, type ActionContext } from '../types'
import {
  canRemoveOrganizationMemberRole,
  type OrganizationMemberRole,
} from '../organization-action.permissions'

const organizationIdentifier = z.string().trim().min(1).max(200).optional()
const userIdentifier = z.string().trim().min(1).max(320)

async function resolveScopedOrganization(
  requested: string | undefined,
  context: ActionContext,
) {
  if (context.actorScope === 'organization') {
    if (!context.organizationId || !context.organizationSlug) {
      throw new Error('El turno no tiene una organización autorizada.')
    }

    if (requested) {
      const resolved = await resolveTargetOrganization(requested)
      if (resolved.id !== context.organizationId) {
        throw new EntityNotFoundError(
          'No puedes ejecutar acciones fuera de tu organización activa.',
        )
      }
      return resolved
    }

    return resolveTargetOrganization(context.organizationId)
  }

  if (!requested) {
    throw new EntityNotFoundError(
      'Indica la organización sobre la que quieres ejecutar la acción.',
    )
  }
  return resolveTargetOrganization(requested)
}

function buildOrganizationPanelPath(
  organization: { id: string; slug: string | null },
  section: string,
): string {
  return organization.slug
    ? `/${encodeURIComponent(organization.slug)}/business-panel/${section}`
    : `/admin/companies/${organization.id}/edit`
}

function buildOrganizationUserPanelPath(
  organization: { id: string; slug: string | null },
  user: { id: string; email: string | null },
  context: ActionContext,
  platformTab: 'organizations' | 'courses' | 'learningPaths' | 'stats',
): string {
  if (context.actorScope === 'platform' || !organization.slug) {
    return `/admin/users?panelUser=${encodeURIComponent(user.id)}&panelTab=${platformTab}`
  }

  const query = new URLSearchParams({
    tab: 'users',
    panelUser: user.id,
    panel: 'stats',
  })
  if (user.email) query.set('search', user.email)
  return `/${encodeURIComponent(organization.slug)}/business-panel/users?${query.toString()}`
}

const removeMemberSchema = z.object({
  organization: organizationIdentifier,
  user: userIdentifier,
})

async function assertMemberCanBeRemoved(
  organizationId: string,
  userId: string,
  context: ActionContext,
) {
  if (userId === context.adminUserId) {
    throw new EntityNotFoundError('No puedes quitarte a ti mismo mediante SofLIA.')
  }

  const supabase = createAdminClient()
  const { data: membership, error: membershipError } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  const normalizedTargetRole = membership?.role?.toLowerCase().trim()
  if (
    membershipError ||
    !normalizedTargetRole ||
    !['owner', 'admin', 'member'].includes(normalizedTargetRole)
  ) {
    throw new EntityNotFoundError(
      'No se pudo revalidar el rol activo del miembro. No se ejecutó ningún cambio.',
    )
  }

  const targetRole = normalizedTargetRole as OrganizationMemberRole
  if (!canRemoveOrganizationMemberRole(context, targetRole)) {
    throw new EntityNotFoundError(
      'Un administrador de organización solo puede quitar miembros. Los propietarios y otros administradores deben ser gestionados por un propietario o superadmin.',
    )
  }

  if (targetRole !== 'owner') return

  const { count } = await supabase
    .from('organization_users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .eq('status', 'active')
  if ((count ?? 0) <= 1) {
    throw new EntityNotFoundError('No se puede quitar al único propietario activo de la organización.')
  }
}

export const removeUserFromOrganizationAction = defineAction({
  id: 'remove_user_from_organization',
  risk: 'sensitive',
  allowedScopes: ['platform', 'organization'],
  description:
    'Quita a un usuario de una organización sin borrar su cuenta ni afectar otras organizaciones. En el panel de organización, organization se omite.',
  paramsExample: { organization: 'acme', user: 'persona@empresa.com' },
  schema: removeMemberSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const user = await resolveOrganizationMember(params.user, organization.id)
    await assertMemberCanBeRemoved(organization.id, user.id, context)

    return {
      summary: `Quitar a "${user.displayName}" (${user.email ?? 'sin email'}) de "${organization.name}".`,
      warnings: [
        'Su cuenta global se conservará y sus accesos en otras organizaciones no cambiarán.',
        'Perderá el acceso inmediato a esta organización.',
      ],
    }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const user = await resolveOrganizationMember(params.user, organization.id)
    await assertMemberCanBeRemoved(organization.id, user.id, context)

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (error) throw new Error(`No se pudo quitar al usuario: ${error.message}`)
    return {
      summary: `Se quitó a "${user.displayName}" de "${organization.name}" sin borrar su cuenta.`,
      details: { userId: user.id, organizationId: organization.id },
      navigateTo: context.actorScope === 'platform'
        ? buildOrganizationUserPanelPath(organization, user, context, 'organizations')
        : buildOrganizationPanelPath(organization, 'users?tab=users'),
    }
  },
})

const userCourseSchema = z.object({
  organization: organizationIdentifier,
  user: userIdentifier,
  course: z.string().trim().min(1).max(200).optional(),
})

async function resolveCourseIdsForRemoval(
  organizationId: string,
  userId: string,
  courseIdentifier?: string,
) {
  const supabase = createAdminClient()
  if (courseIdentifier) {
    const course = await resolveTargetCourse(courseIdentifier)
    const { data: assignment } = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .limit(1)
      .maybeSingle()
    if (!assignment) return { courseIds: [], labels: [] }
    return { courseIds: [course.id], labels: [course.title] }
  }

  const { data: assignments } = await supabase
    .from('organization_course_assignments')
    .select('course_id, courses(title)')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  const rows = (assignments ?? []) as Array<{
    course_id: string
    courses: { title?: string | null } | { title?: string | null }[] | null
  }>
  const byId = new Map<string, string>()
  rows.forEach((row) => {
    const related = Array.isArray(row.courses) ? row.courses[0] : row.courses
    byId.set(row.course_id, related?.title || row.course_id)
  })
  return { courseIds: [...byId.keys()], labels: [...byId.values()] }
}

export const removeUserCoursesAction = defineAction({
  id: 'remove_user_courses_from_organization',
  risk: 'sensitive',
  allowedScopes: ['platform', 'organization'],
  description:
    'Revoca uno o todos los cursos de un usuario dentro de una organización. Omite course para revocar todos; en el panel de organización también omite organization.',
  paramsExample: { organization: 'acme', user: 'persona@empresa.com', course: 'Fundamentos de IA' },
  schema: userCourseSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const user = await resolveOrganizationMember(params.user, organization.id)
    const target = await resolveCourseIdsForRemoval(organization.id, user.id, params.course)
    if (!target.courseIds.length) {
      throw new EntityNotFoundError('El usuario no tiene cursos en esta organización.')
    }
    return {
      summary: `Revocar ${target.courseIds.length} curso(s) de "${user.displayName}" en "${organization.name}": ${target.labels.join(', ')}.`,
      warnings: [
        'Se eliminarán las asignaciones de esos cursos únicamente dentro de esta organización.',
        'El historial de progreso se conserva; esta acción no borra evidencias de aprendizaje.',
      ],
    }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const user = await resolveOrganizationMember(params.user, organization.id)
    const target = await resolveCourseIdsForRemoval(organization.id, user.id, params.course)
    if (!target.courseIds.length) {
      return {
        summary: `"${user.displayName}" ya no tiene esas asignaciones de curso en "${organization.name}".`,
        details: { userId: user.id, organizationId: organization.id, assignmentsRemoved: 0 },
        navigateTo: buildOrganizationUserPanelPath(organization, user, context, 'courses'),
      }
    }
    const supabase = createAdminClient()
    const assignmentsResult = await supabase
      .from('organization_course_assignments')
      .delete({ count: 'exact' })
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .in('course_id', target.courseIds)
    if (assignmentsResult.error) throw new Error('No se pudieron revocar los cursos del usuario.')
    return {
      summary: `Se revocaron ${target.courseIds.length} curso(s) de "${user.displayName}" en "${organization.name}".`,
      details: {
        userId: user.id,
        organizationId: organization.id,
        assignmentsRemoved: assignmentsResult.count ?? 0,
      },
      navigateTo: buildOrganizationUserPanelPath(organization, user, context, 'courses'),
    }
  },
})

const assignCourseSchema = z.object({
  organization: organizationIdentifier,
  user: userIdentifier,
  course: z.string().trim().min(1).max(200),
  dueDate: z.string().datetime().optional(),
  message: z.string().trim().max(2_000).optional(),
})

async function assertOrganizationHasCourse(organizationId: string, courseId: string) {
  const supabase = createAdminClient()
  const [{ data: purchase }, { data: course }] = await Promise.all([
    supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .eq('access_status', 'active')
      .maybeSingle(),
    supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('is_active', true)
      .maybeSingle(),
  ])
  if (!purchase) throw new EntityNotFoundError('La organización no tiene acceso activo a ese curso.')
  if (!course) throw new EntityNotFoundError('El curso ya no está activo.')
}

export const assignCourseToUserAction = defineAction({
  id: 'assign_course_to_user',
  risk: 'configure',
  allowedScopes: ['platform', 'organization'],
  description:
    'Asigna un curso adquirido por la organización a uno de sus miembros activos. En el panel de organización, organization se omite.',
  paramsExample: { organization: 'acme', user: 'persona@empresa.com', course: 'Fundamentos de IA' },
  schema: assignCourseSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [user, course] = await Promise.all([
      resolveOrganizationMember(params.user, organization.id),
      resolveTargetCourse(params.course),
    ])
    await assertOrganizationHasCourse(organization.id, course.id)
    return { summary: `Asignar "${course.title}" a "${user.displayName}" en "${organization.name}".` }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [user, course] = await Promise.all([
      resolveOrganizationMember(params.user, organization.id),
      resolveTargetCourse(params.course),
    ])
    await assertOrganizationHasCourse(organization.id, course.id)
    const result = await CourseDefaultsService.assignCourseToUsers({
      organizationId: organization.id,
      courseId: course.id,
      userIds: [user.id],
      assignedBy: context.adminUserId,
      assignmentSource: 'manual',
      dueDate: params.dueDate ?? null,
      message: params.message ?? null,
    })
    return {
      summary: result.assigned
        ? `Se asignó "${course.title}" a "${user.displayName}".`
        : `"${user.displayName}" ya tenía asignado "${course.title}".`,
      details: { userId: user.id, courseId: course.id, assigned: result.assigned },
      navigateTo: buildOrganizationUserPanelPath(organization, user, context, 'courses'),
    }
  },
})

const assignLearningPathSchema = z.object({
  organization: organizationIdentifier,
  user: userIdentifier,
  learningPath: z.string().trim().min(1).max(200),
})

export const assignLearningPathToUserAction = defineAction({
  id: 'assign_learning_path_to_user',
  risk: 'configure',
  allowedScopes: ['platform', 'organization'],
  description:
    'Asigna una ruta de aprendizaje activa a un miembro de la organización y sincroniza sus cursos. En el panel de organización, organization se omite.',
  paramsExample: { organization: 'acme', user: 'persona@empresa.com', learningPath: 'Ruta de IA' },
  schema: assignLearningPathSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [user, learningPath] = await Promise.all([
      resolveOrganizationMember(params.user, organization.id),
      resolveTargetLearningPath(params.learningPath),
    ])
    if (!learningPath.isActive) throw new EntityNotFoundError('La ruta de aprendizaje no está activa.')
    return { summary: `Asignar la ruta "${learningPath.title}" a "${user.displayName}" en "${organization.name}".` }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [user, learningPath] = await Promise.all([
      resolveOrganizationMember(params.user, organization.id),
      resolveTargetLearningPath(params.learningPath),
    ])
    if (!learningPath.isActive) throw new EntityNotFoundError('La ruta de aprendizaje ya no está activa.')
    const assignment = await AdminLearningPathsService.assignToUser(
      organization.id,
      user.id,
      learningPath.id,
      context.adminUserId,
    )
    return {
      summary: `Se asignó la ruta "${learningPath.title}" a "${user.displayName}".`,
      details: { assignmentId: assignment.id, userId: user.id, learningPathId: learningPath.id },
      navigateTo: buildOrganizationUserPanelPath(organization, user, context, 'learningPaths'),
    }
  },
})

const createStructureSchema = z.object({
  organization: organizationIdentifier,
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).optional(),
  template: z.enum(['regions_zones_teams', 'regions_only', 'zones_only', 'flat', 'custom']).optional(),
  leader: userIdentifier.optional(),
})

const createHierarchyNodeSchema = z.object({
  organization: organizationIdentifier,
  structure: z.string().trim().min(1).max(200).optional(),
  parent: z.string().trim().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(200),
  type: z.enum(['region', 'zone', 'team', 'custom']).default('team'),
  description: z.string().trim().max(2_000).optional(),
  leader: userIdentifier.optional(),
})

function normalizeEntityName(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

async function resolveHierarchyPlacement(params: {
  organizationId: string
  structure?: string
  parent?: string
  nodeName: string
}) {
  const supabase = createAdminClient()
  const { data: structures, error: structuresError } = await supabase
    .from('organization_structures')
    .select('id, name, is_default')
    .eq('organization_id', params.organizationId)

  if (structuresError) throw new Error(`No se pudieron consultar las estructuras: ${structuresError.message}`)
  if (!structures?.length) {
    throw new EntityNotFoundError('La organización todavía no tiene una estructura. Crea una primero.')
  }

  let structure = null as (typeof structures)[number] | null
  if (params.structure) {
    const target = normalizeEntityName(params.structure)
    const matches = structures.filter((candidate) =>
      candidate.id === params.structure || normalizeEntityName(candidate.name) === target,
    )
    if (matches.length !== 1) {
      throw new EntityNotFoundError(
        matches.length > 1
          ? `Hay varias estructuras llamadas "${params.structure}". Indica su identificador.`
          : `No encontré la estructura "${params.structure}" en esta organización.`,
      )
    }
    structure = matches[0]
  } else {
    structure = structures.find((candidate) => candidate.is_default) ?? null
    if (!structure && structures.length === 1) structure = structures[0]
    if (!structure) {
      throw new EntityNotFoundError(
        `Indica en cuál estructura quieres crear el equipo: ${structures.map((item) => item.name).join(', ')}.`,
      )
    }
  }

  const { data: nodes, error: nodesError } = await supabase
    .from('organization_nodes')
    .select('id, name, type, parent_id, path, depth, position')
    .eq('organization_id', params.organizationId)
    .eq('structure_id', structure.id)

  if (nodesError) throw new Error(`No se pudo consultar la jerarquía: ${nodesError.message}`)
  const hierarchyNodes = nodes ?? []

  let parent = null as (typeof hierarchyNodes)[number] | null
  if (params.parent) {
    const target = normalizeEntityName(params.parent)
    const matches = hierarchyNodes.filter((candidate) =>
      candidate.id === params.parent || normalizeEntityName(candidate.name) === target,
    )
    if (matches.length !== 1) {
      throw new EntityNotFoundError(
        matches.length > 1
          ? `Hay varios nodos llamados "${params.parent}". Indica su identificador.`
          : `No encontré el nodo padre "${params.parent}" dentro de "${structure.name}".`,
      )
    }
    parent = matches[0]
  } else {
    const roots = hierarchyNodes.filter((candidate) => !candidate.parent_id)
    if (roots.length !== 1) {
      throw new EntityNotFoundError(
        roots.length === 0
          ? `La estructura "${structure.name}" no tiene un nodo principal. Indica primero dónde agregar el equipo.`
          : `La estructura "${structure.name}" tiene varios nodos principales. Indica el nodo padre.`,
      )
    }
    parent = roots[0]
  }

  const duplicate = hierarchyNodes.find((candidate) =>
    candidate.parent_id === parent?.id &&
    normalizeEntityName(candidate.name) === normalizeEntityName(params.nodeName),
  )
  if (duplicate) {
    throw new EntityNotFoundError(
      `Ya existe "${duplicate.name}" directamente dentro de "${parent.name}".`,
    )
  }

  const siblingPositions = hierarchyNodes
    .filter((candidate) => candidate.parent_id === parent?.id)
    .map((candidate) => candidate.position ?? 0)

  return {
    structure,
    parent,
    nextPosition: Math.max(0, ...siblingPositions) + 1,
  }
}

async function resolveHierarchyNode(params: {
  organizationId: string
  node: string
  structure?: string
}) {
  const supabase = createAdminClient()
  let structureId: string | null = null

  if (params.structure) {
    const { data: structures, error } = await supabase
      .from('organization_structures')
      .select('id, name')
      .eq('organization_id', params.organizationId)
    if (error) throw new Error(`No se pudieron consultar las estructuras: ${error.message}`)

    const target = normalizeEntityName(params.structure)
    const matches = (structures ?? []).filter((candidate) =>
      candidate.id === params.structure || normalizeEntityName(candidate.name) === target,
    )
    if (matches.length !== 1) {
      throw new EntityNotFoundError(
        matches.length > 1
          ? `Hay varias estructuras llamadas "${params.structure}". Indica su identificador.`
          : `No encontré la estructura "${params.structure}" en esta organización.`,
      )
    }
    structureId = matches[0].id
  }

  let query = supabase
    .from('organization_nodes')
    .select('id, name, type, structure_id, manager_id')
    .eq('organization_id', params.organizationId)
  if (structureId) query = query.eq('structure_id', structureId)

  const { data: nodes, error } = await query
  if (error) throw new Error(`No se pudo consultar la jerarquía: ${error.message}`)

  const target = normalizeEntityName(params.node)
  const matches = (nodes ?? []).filter((candidate) =>
    candidate.id === params.node || normalizeEntityName(candidate.name) === target,
  )
  if (matches.length !== 1) {
    throw new EntityNotFoundError(
      matches.length > 1
        ? `Hay varios nodos llamados "${params.node}". Indica la estructura o el identificador.`
        : `No encontré el nodo "${params.node}" dentro de esta organización.`,
    )
  }

  return matches[0]
}

async function assignMemberToHierarchyNode(params: {
  node: { id: string; manager_id: string | null }
  userId: string
  role: 'leader' | 'member'
  isPrimary: boolean
}) {
  const supabase = createAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('organization_node_users')
    .select('id, role')
    .eq('node_id', params.node.id)
    .eq('user_id', params.userId)
    .maybeSingle()
  if (existingError) throw new Error(`No se pudo revisar la asignación: ${existingError.message}`)

  if (params.role === 'leader') {
    const { error } = await supabase
      .from('organization_node_users')
      .update({ role: 'member' })
      .eq('node_id', params.node.id)
      .eq('role', 'leader')
    if (error) throw new Error(`No se pudo actualizar el liderazgo anterior: ${error.message}`)
  }

  const assignment = existing
    ? await supabase
        .from('organization_node_users')
        .update({ role: params.role, is_primary: params.isPrimary })
        .eq('id', existing.id)
    : await supabase
        .from('organization_node_users')
        .insert({
          node_id: params.node.id,
          user_id: params.userId,
          role: params.role,
          is_primary: params.isPrimary,
        })
  if (assignment.error) {
    throw new Error(`No se pudo asignar al usuario al nodo: ${assignment.error.message}`)
  }

  if (params.role === 'leader' || params.node.manager_id === params.userId) {
    const { error } = await supabase
      .from('organization_nodes')
      .update({ manager_id: params.role === 'leader' ? params.userId : null })
      .eq('id', params.node.id)
    if (error) throw new Error(`No se pudo actualizar el líder del nodo: ${error.message}`)
  }
}

export const createOrganizationHierarchyNodeAction = defineAction({
  id: 'create_organization_hierarchy_node',
  risk: 'create',
  allowedScopes: ['platform', 'organization'],
  description:
    'Crea un equipo, división, región, zona o nodo dentro de una estructura organizacional existente. Si se omite parent, lo agrega bajo el nodo principal de la estructura predeterminada. No confundir con crear otra estructura independiente.',
  paramsExample: {
    organization: 'acme',
    name: 'División de ventas',
    type: 'team',
    leader: 'diana@empresa.com',
  },
  schema: createHierarchyNodeSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [placement, leader] = await Promise.all([
      resolveHierarchyPlacement({
        organizationId: organization.id,
        structure: params.structure,
        parent: params.parent,
        nodeName: params.name,
      }),
      params.leader
        ? resolveOrganizationMember(params.leader, organization.id)
        : Promise.resolve(null),
    ])
    return {
      summary: `Crear el ${params.type} "${params.name}" dentro de "${placement.parent.name}" en la estructura "${placement.structure.name}" de "${organization.name}"${leader ? ` y asignar a "${leader.displayName}" como líder` : ''}.`,
    }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [placement, leader] = await Promise.all([
      resolveHierarchyPlacement({
        organizationId: organization.id,
        structure: params.structure,
        parent: params.parent,
        nodeName: params.name,
      }),
      params.leader
        ? resolveOrganizationMember(params.leader, organization.id)
        : Promise.resolve(null),
    ])
    const nodeSlug = params.name
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    const parentPath = placement.parent.path || 'root'
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('organization_nodes')
      .insert({
        organization_id: organization.id,
        structure_id: placement.structure.id,
        parent_id: placement.parent.id,
        name: params.name,
        type: params.type,
        position: placement.nextPosition,
        path: `${parentPath}.${nodeSlug || 'nodo'}`,
        depth: (placement.parent.depth ?? 0) + 1,
        manager_id: leader?.id ?? null,
        properties: params.description ? { description: params.description } : {},
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(`No se pudo crear el nodo: ${error?.message ?? 'sin resultado'}`)
    }

    if (leader) {
      try {
        await assignMemberToHierarchyNode({
          node: { id: data.id, manager_id: leader.id },
          userId: leader.id,
          role: 'leader',
          isPrimary: true,
        })
      } catch (assignmentError) {
        await supabase.from('organization_nodes').delete().eq('id', data.id)
        throw assignmentError
      }
    }

    return {
      summary: `Se creó "${params.name}" dentro de "${placement.parent.name}" en la estructura "${placement.structure.name}"${leader ? ` y se asignó a "${leader.displayName}" como líder` : ''}.`,
      details: {
        nodeId: data.id,
        structureId: placement.structure.id,
        parentNodeId: placement.parent.id,
        organizationId: organization.id,
      },
      navigateTo: buildOrganizationPanelPath(
        organization,
        `hierarchy/node/${data.id}`,
      ),
    }
  },
})

const assignHierarchyMemberSchema = z.object({
  organization: organizationIdentifier,
  structure: z.string().trim().min(1).max(200).optional(),
  node: z.string().trim().min(1).max(200),
  user: userIdentifier,
  role: z.enum(['leader', 'member']).default('member'),
  isPrimary: z.boolean().default(false),
})

export const assignUserToHierarchyNodeAction = defineAction({
  id: 'assign_user_to_hierarchy_node',
  risk: 'configure',
  allowedScopes: ['platform', 'organization'],
  description:
    'Asigna un miembro activo de la organización a un nodo o equipo de la jerarquía como líder o miembro. Si se asigna un nuevo líder, el líder anterior pasa a miembro.',
  paramsExample: {
    organization: 'acme',
    node: 'Dirección de ventas',
    user: 'diana@empresa.com',
    role: 'leader',
    isPrimary: true,
  },
  schema: assignHierarchyMemberSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [node, user] = await Promise.all([
      resolveHierarchyNode({
        organizationId: organization.id,
        node: params.node,
        structure: params.structure,
      }),
      resolveOrganizationMember(params.user, organization.id),
    ])
    return {
      summary: `Asignar a "${user.displayName}" como ${params.role === 'leader' ? 'líder' : 'miembro'} de "${node.name}" en "${organization.name}".`,
    }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [node, user] = await Promise.all([
      resolveHierarchyNode({
        organizationId: organization.id,
        node: params.node,
        structure: params.structure,
      }),
      resolveOrganizationMember(params.user, organization.id),
    ])
    await assignMemberToHierarchyNode({
      node,
      userId: user.id,
      role: params.role,
      isPrimary: params.isPrimary,
    })
    const inheritedCourses = await CourseDefaultsService.applyDefaultRulesForUser({
      organizationId: organization.id,
      userId: user.id,
    })
    return {
      summary: `Se asignó a "${user.displayName}" como ${params.role === 'leader' ? 'líder' : 'miembro'} de "${node.name}".`,
      details: {
        nodeId: node.id,
        userId: user.id,
        organizationId: organization.id,
        assigned: inheritedCourses.assigned,
      },
      navigateTo: buildOrganizationPanelPath(
        organization,
        `hierarchy/node/${node.id}`,
      ),
    }
  },
})

const assignCourseToHierarchySchema = z.object({
  organization: organizationIdentifier,
  structure: z.string().trim().min(1).max(200).optional(),
  node: z.string().trim().min(1).max(200),
  course: z.string().trim().min(1).max(200),
  includeDescendants: z.boolean().default(true),
  dueDate: z.string().datetime().optional(),
  message: z.string().trim().max(2_000).optional(),
})

export const assignCourseToHierarchyNodeAction = defineAction({
  id: 'assign_course_to_hierarchy_node',
  risk: 'configure',
  allowedScopes: ['platform', 'organization'],
  description:
    'Asigna un curso adquirido por la organización a un nodo de la jerarquía, a sus miembros actuales y, opcionalmente, a sus descendientes. Mantiene la regla para futuros miembros.',
  paramsExample: {
    organization: 'acme',
    node: 'Dirección de ventas',
    course: 'Fundamentos de IA',
    includeDescendants: true,
  },
  schema: assignCourseToHierarchySchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [node, course] = await Promise.all([
      resolveHierarchyNode({
        organizationId: organization.id,
        node: params.node,
        structure: params.structure,
      }),
      resolveTargetCourse(params.course),
    ])
    await assertOrganizationHasCourse(organization.id, course.id)
    return {
      summary: `Asignar "${course.title}" al nodo "${node.name}" de "${organization.name}"${params.includeDescendants ? ' incluyendo sus nodos descendientes' : ''}.`,
    }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const [node, course] = await Promise.all([
      resolveHierarchyNode({
        organizationId: organization.id,
        node: params.node,
        structure: params.structure,
      }),
      resolveTargetCourse(params.course),
    ])
    await assertOrganizationHasCourse(organization.id, course.id)

    const ruleId = await CourseDefaultsService.createOrReactivateDefaultRule({
      organizationId: organization.id,
      courseId: course.id,
      scopeType: 'node',
      nodeId: node.id,
      includeDescendants: params.includeDescendants,
      createdBy: context.adminUserId,
    })
    const applyResult = await CourseDefaultsService.applyDefaultRules({
      organizationId: organization.id,
      ruleIds: [ruleId],
      appliedBy: context.adminUserId,
    })

    const { error: nodeCourseError } = await createAdminClient()
      .from('organization_node_courses')
      .upsert({
        node_id: node.id,
        course_id: course.id,
        assigned_by: context.adminUserId,
        assigned_at: new Date().toISOString(),
        due_date: params.dueDate ?? null,
        message: params.message ?? null,
        status: 'active',
      }, { onConflict: 'node_id, course_id' })
    if (nodeCourseError) {
      throw new Error(`El curso se asignó, pero no se pudo reflejar en el nodo: ${nodeCourseError.message}`)
    }

    return {
      summary: `Se asignó "${course.title}" al nodo "${node.name}" y se aplicó a ${applyResult.assigned + applyResult.existing} miembro(s).`,
      details: {
        nodeId: node.id,
        courseId: course.id,
        organizationId: organization.id,
        assigned: applyResult.assigned,
      },
      navigateTo: buildOrganizationPanelPath(
        organization,
        `hierarchy/node/${node.id}`,
      ),
    }
  },
})

export const createOrganizationStructureAction = defineAction({
  id: 'create_organization_structure',
  risk: 'create',
  allowedScopes: ['platform', 'organization'],
  description:
    'Crea una estructura organizacional independiente (un nuevo mapa de jerarquía). Puede crear su nodo principal y asignarle un líder en la misma acción usando leader. Para agregar un equipo o división dentro de una estructura existente usa create_organization_hierarchy_node.',
  paramsExample: {
    organization: 'acme',
    name: 'Estructura comercial',
    template: 'regions_zones_teams',
    leader: 'diana@empresa.com',
  },
  schema: createStructureSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const leader = params.leader
      ? await resolveOrganizationMember(params.leader, organization.id)
      : null
    return {
      summary: `Crear la estructura "${params.name}" en "${organization.name}"${params.template ? ` usando la plantilla ${params.template}` : ''}${leader ? `, crear su nodo principal y asignar a "${leader.displayName}" como líder` : ''}.`,
    }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const leader = params.leader
      ? await resolveOrganizationMember(params.leader, organization.id)
      : null
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('organization_structures')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()
    const { data, error } = await supabase
      .from('organization_structures')
      .insert({
        organization_id: organization.id,
        name: params.name,
        description: params.description ?? null,
        template: params.template ?? null,
        metadata: null as Json | null,
        created_by: context.adminUserId,
        is_default: !existing,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`No se pudo crear la estructura: ${error?.message ?? 'sin resultado'}`)

    let rootNodeId: string | null = null
    if (leader) {
      const { data: rootNode, error: rootNodeError } = await supabase
        .from('organization_nodes')
        .insert({
          organization_id: organization.id,
          structure_id: data.id,
          parent_id: null,
          name: params.name,
          type: 'team',
          position: 0,
          path: 'root',
          depth: 0,
          manager_id: leader.id,
          properties: params.description ? { description: params.description } : {},
        })
        .select('id')
        .single()
      if (rootNodeError || !rootNode) {
        await supabase.from('organization_structures').delete().eq('id', data.id)
        throw new Error(`No se pudo crear el nodo principal: ${rootNodeError?.message ?? 'sin resultado'}`)
      }
      rootNodeId = rootNode.id

      try {
        await assignMemberToHierarchyNode({
          node: { id: rootNode.id, manager_id: leader.id },
          userId: leader.id,
          role: 'leader',
          isPrimary: true,
        })
      } catch (assignmentError) {
        await supabase.from('organization_structures').delete().eq('id', data.id)
        throw assignmentError
      }
    }

    return {
      summary: `Se creó la estructura "${params.name}" en "${organization.name}"${leader ? ` y se asignó a "${leader.displayName}" como líder` : ''}.`,
      details: {
        structureId: data.id,
        organizationId: organization.id,
        nodeId: rootNodeId,
      },
      navigateTo: buildOrganizationPanelPath(
        organization,
        rootNodeId ? `hierarchy/node/${rootNodeId}` : 'hierarchy',
      ),
    }
  },
})

const analyticsReportSchema = z.object({
  organization: organizationIdentifier,
  locale: z.enum(['es', 'en', 'pt']).default('es'),
  days: z.number().int().min(1).max(365).default(90),
})

export const generateOrganizationAnalyticsReportAction = defineAction({
  id: 'generate_organization_analytics_report',
  risk: 'create',
  allowedScopes: ['platform', 'organization'],
  description:
    'Genera o reutiliza el informe diario PDF de analytics de la organización. Por defecto analiza los últimos 90 días.',
  paramsExample: { organization: 'acme', locale: 'es', days: 90 },
  schema: analyticsReportSchema,

  async preview(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    return { summary: `Generar el reporte de analytics de "${organization.name}" para los últimos ${params.days} días (${params.locale}).` }
  },

  async execute(params, context) {
    const organization = await resolveScopedOrganization(params.organization, context)
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - params.days)
    const document = await getOrganizationAnalyticsDailyReport({
      organizationId: organization.id,
      locale: params.locale,
      generatedByUserId: context.adminUserId,
      filters: { from: from.toISOString(), to: to.toISOString(), granularity: 'month' },
    })
    const reportUrl = organization.slug
      ? `/${organization.slug}/business-panel/reports`
      : `/admin/companies/${organization.id}`
    return {
      summary: `${document.reused ? 'Se reutilizó' : 'Se generó'} el reporte de analytics de "${organization.name}"${organization.slug ? ' y se inició su descarga' : ''}.`,
      details: {
        reportDate: document.reportDate,
        fileName: document.fileName,
        reportUrl,
      },
      navigateTo: buildOrganizationPanelPath(organization, 'reports'),
      downloads: organization.slug
        ? [{
            url: `/api/${encodeURIComponent(organization.slug)}/business/reports-analytics/insights`,
            method: 'POST' as const,
            body: { locale: params.locale, format: 'pdf' },
          }]
        : undefined,
    }
  },
})
