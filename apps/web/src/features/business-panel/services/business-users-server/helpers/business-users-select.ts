export const BUSINESS_USER_SELECT = `
  organization_id,
  user_id,
  role,
  job_title,
  status,
  joined_at,
  users:users!organization_users_user_id_fkey (
    id,
    username,
    email,
    first_name,
    last_name,
    display_name,
    cargo_rol,
    email_verified,
    profile_picture_url,
    bio,
    location,
    phone,
    date_of_birth,
    gender,
    last_login_at,
    last_activity_at,
    created_at,
    updated_at
  )
`
