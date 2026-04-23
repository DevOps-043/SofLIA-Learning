export const LEARNING_PATH_SELECT =
  'id, title, slug, description, is_active, created_at, updated_at'

export const LEARNING_PATH_ITEM_SELECT =
  'id, learning_path_id, course_id, position, courses ( id, title, slug, thumbnail_url, category, level )'

export const ORGANIZATION_ASSIGNMENT_SELECT =
  'id, organization_id, learning_path_id, assigned_by, assigned_at, status'

export const USER_ASSIGNMENT_SELECT =
  'id, organization_id, user_id, learning_path_id, assigned_by, assigned_at, status'

export const USER_ASSIGNMENT_WITH_USER_SELECT =
  'id, organization_id, user_id, learning_path_id, assigned_at, status, users:user_id ( id, email, display_name, first_name, last_name )'

export const ORGANIZATION_ASSIGNMENT_SUMMARY_SELECT =
  'id, organization_id, assigned_at, status, organizations:organization_id ( id, name, slug )'

export const USER_ASSIGNMENT_SUMMARY_SELECT =
  'id, organization_id, user_id, assigned_at, status, organizations:organization_id ( id, name, slug ), users:user_id ( id, email, display_name, first_name, last_name )'
