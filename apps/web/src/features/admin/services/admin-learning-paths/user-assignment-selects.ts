export const USER_ASSIGNMENT_SELECT = `
  id,
  organization_id,
  user_id,
  learning_path_id,
  assigned_at,
  status,
  assignment_source,
  default_rule_id,
  users:user_id (
    id,
    email,
    display_name,
    first_name,
    last_name
  )
`

export const USER_ASSIGNMENT_FALLBACK_SELECT = `
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
`

export const USER_ASSIGNMENT_WITH_USER_SELECT = USER_ASSIGNMENT_SELECT
export const USER_ASSIGNMENT_LEGACY_SELECT = USER_ASSIGNMENT_FALLBACK_SELECT
