import { z } from 'zod'

const numberOrString = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()

const locationFields = {
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(200).optional().nullable(),
  state: z.string().max(200).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  postal_code: z.string().max(40).optional().nullable(),
  latitude: numberOrString,
  longitude: numberOrString,
}

const contactFields = {
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
}

const metadataField = z.record(z.unknown()).optional().nullable()

export const createRegionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional().nullable(),
  code: z.string().max(40).optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  metadata: metadataField,
  ...locationFields,
  ...contactFields,
})

export type CreateRegionBody = z.infer<typeof createRegionSchema>

export const updateRegionSchema = createRegionSchema
  .extend({ is_active: z.boolean().optional() })
  .partial()

export type UpdateRegionBody = z.infer<typeof updateRegionSchema>

export const createZoneSchema = z.object({
  region_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional().nullable(),
  code: z.string().max(40).optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  metadata: metadataField,
  ...locationFields,
  ...contactFields,
})

export type CreateZoneBody = z.infer<typeof createZoneSchema>

export const updateZoneSchema = createZoneSchema
  .extend({ is_active: z.boolean().optional() })
  .partial()

export type UpdateZoneBody = z.infer<typeof updateZoneSchema>

export const createTeamSchema = z.object({
  zone_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional().nullable(),
  code: z.string().max(40).optional().nullable(),
  leader_id: z.string().uuid().optional().nullable(),
  target_goal: z.string().max(500).optional().nullable(),
  monthly_target: z.number().int().min(0).max(1_000_000).optional().nullable(),
  max_members: z.number().int().min(1).max(10_000).optional().nullable(),
  metadata: metadataField,
  ...locationFields,
  ...contactFields,
})

export type CreateTeamBody = z.infer<typeof createTeamSchema>

export const updateTeamSchema = createTeamSchema
  .extend({ is_active: z.boolean().optional() })
  .partial()

export type UpdateTeamBody = z.infer<typeof updateTeamSchema>

export const createNodeSchema = z
  .object({
    structure_id: z.string().uuid(),
    parent_id: z.string().uuid().optional().nullable(),
    type: z.string().min(1).max(80),
    name: z.string().min(1).max(200),
    description: z.string().max(2_000).optional().nullable(),
    code: z.string().max(40).optional().nullable(),
    position: z.number().int().min(0).max(100_000).optional().nullable(),
    manager_id: z.string().uuid().optional().nullable(),
    properties: z.record(z.unknown()).optional().nullable(),
    metadata: metadataField,
  })
  .passthrough()

export type CreateNodeBody = z.infer<typeof createNodeSchema>

export const nodeMemberAssignmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['leader', 'member']).optional().default('member'),
  isPrimary: z.boolean().optional().default(false),
})

export type NodeMemberAssignmentBody = z.infer<typeof nodeMemberAssignmentSchema>

export const updateNodeSchema = createNodeSchema.partial()

export type UpdateNodeBody = z.infer<typeof updateNodeSchema>

export const moveNodeSchema = z.object({
  new_parent_id: z.string().uuid().optional().nullable(),
  new_position: z.number().int().min(0).max(10_000).optional(),
})

export type MoveNodeBody = z.infer<typeof moveNodeSchema>

export const nodeMembersSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(1_000),
})

export type NodeMembersBody = z.infer<typeof nodeMembersSchema>

export const assignUsersSchema = z.object({
  user_id: z.string().uuid(),
  team_id: z.string().uuid(),
  role: z.enum(['team_leader', 'member']).optional(),
})

export type AssignUsersBody = z.infer<typeof assignUsersSchema>

export const assignCoursesSchema = z.object({
  entity_id: z.string().uuid(),
  course_ids: z.array(z.string().uuid()).min(1).max(500),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  approach: z.enum(['fast', 'balanced', 'long', 'custom']).optional().nullable(),
  message: z.string().max(2_000).optional().nullable(),
})

export type AssignCoursesBody = z.infer<typeof assignCoursesSchema>

export const updateCourseAssignmentSchema = z.object({
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  approach: z
    .enum(['fast', 'balanced', 'long', 'custom'])
    .optional()
    .nullable(),
  message: z.string().max(2_000).optional().nullable(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
})

export type UpdateCourseAssignmentBody = z.infer<
  typeof updateCourseAssignmentSchema
>

export const updateHierarchyConfigSchema = z
  .object({
    hierarchy_enabled: z.boolean().optional(),
    labels: z
      .object({
        region: z.string().max(80).optional(),
        zone: z.string().max(80).optional(),
        team: z.string().max(80).optional(),
      })
      .partial()
      .optional(),
    auto_assign_new_users: z.boolean().optional(),
    require_team_assignment: z.boolean().optional(),
  })
  .passthrough()

export type UpdateHierarchyConfigBody = z.infer<
  typeof updateHierarchyConfigSchema
>

export const geocodeSchema = z.object({
  address: z.string().max(500).optional(),
  city: z.string().max(200).optional(),
  state: z.string().max(200).optional(),
  country: z.string().max(120).optional(),
  postal_code: z.string().max(40).optional(),
  query: z.string().max(500).optional(),
})

export type GeocodeBody = z.infer<typeof geocodeSchema>

export const createChatSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(1).max(500),
  title: z.string().max(200).optional().nullable(),
  scope: z
    .enum(['private', 'team', 'zone', 'region', 'organization'])
    .optional(),
  scope_id: z.string().uuid().optional().nullable(),
})

export type CreateChatBody = z.infer<typeof createChatSchema>

export const createHierarchyChatSchema = z.object({
  entity_type: z.enum(['region', 'zone', 'team', 'node']),
  entity_id: z.string().uuid(),
  chat_type: z.enum(['horizontal', 'vertical']),
  name: z.string().max(200).optional().nullable(),
  description: z.string().max(2_000).optional().nullable(),
})

export type CreateHierarchyChatBody = z.infer<
  typeof createHierarchyChatSchema
>

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(20_000),
  message_type: z.string().max(40).optional(),
  metadata: z.record(z.unknown()).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url().max(2_000),
        type: z.string().max(120).optional(),
        name: z.string().max(300).optional(),
      }),
    )
    .max(10)
    .optional(),
  reply_to: z.string().uuid().optional().nullable(),
})

export type ChatMessageBody = z.infer<typeof chatMessageSchema>

export const chatMessageEditSchema = z.object({
  content: z.string().min(1).max(20_000),
})

export type ChatMessageEditBody = z.infer<typeof chatMessageEditSchema>

export const chatReadSchema = z
  .object({
    last_read_at: z.string().datetime().optional().nullable(),
    last_read_message_id: z.string().uuid().optional().nullable(),
  })
  .partial()

export type ChatReadBody = z.infer<typeof chatReadSchema>

export const createStructureSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional().nullable(),
  template: z
    .enum(['regions_zones_teams', 'regions_only', 'zones_only', 'flat', 'custom'])
    .optional(),
  metadata: metadataField,
})

export type CreateStructureBody = z.infer<typeof createStructureSchema>

export const reverseGeocodeQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
})
