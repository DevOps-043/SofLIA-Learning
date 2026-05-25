export const COURSE_SELECT_FIELDS = `
  id,
  title,
  description,
  category,
  level,
  instructor_id,
  duration_total_minutes,
  thumbnail_url,
  slug,
  is_active,
  price,
  average_rating,
  student_count,
  review_count,
  learning_objectives,
  created_at,
  updated_at,
  instructor:users!fk_courses_instructor (
    id,
    first_name,
    last_name,
    email,
    username
  )
`
