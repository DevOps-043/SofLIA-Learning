import type { CourseSkillRow } from './full.types'

export function mapCourseSkills(rows: CourseSkillRow[]) {
  return rows.map((courseSkill) => ({
    id: courseSkill.id,
    skill_id: courseSkill.skills?.skill_id,
    name: courseSkill.skills?.name,
    slug: courseSkill.skills?.slug,
    description: courseSkill.skills?.description,
    category: courseSkill.skills?.category,
    icon_url: courseSkill.skills?.icon_url,
    icon_type: courseSkill.skills?.icon_type,
    icon_name: courseSkill.skills?.icon_name,
    color: courseSkill.skills?.color,
    level: courseSkill.skills?.level,
    is_primary: courseSkill.is_primary,
    is_required: courseSkill.is_required,
    proficiency_level: courseSkill.proficiency_level,
    display_order: courseSkill.display_order,
  }))
}
