import type { CourseSkillRow } from './types'

export function formatCourseSkillResponse(cs: CourseSkillRow) {
  return {
    id: cs.id,
    skill_id: cs.skills?.skill_id,
    name: cs.skills?.name,
    slug: cs.skills?.slug,
    description: cs.skills?.description,
    category: cs.skills?.category,
    icon_url: cs.skills?.icon_url,
    icon_type: cs.skills?.icon_type,
    icon_name: cs.skills?.icon_name,
    color: cs.skills?.color,
    level: cs.skills?.level,
    is_primary: cs.is_primary,
    is_required: cs.is_required,
    proficiency_level: cs.proficiency_level,
    display_order: cs.display_order,
    user_level: cs.user_level || null,
    user_course_count: cs.user_course_count || 0,
    user_badge_url: cs.user_badge_url || null,
  }
}
