export interface Skill {
  skill_id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  icon_url?: string;
  icon_type?: string;
  icon_name?: string;
  color?: string;
  level?: string;
}

export interface CourseSkill extends Skill {
  id?: string;
  is_primary?: boolean;
  is_required?: boolean;
  proficiency_level?: string;
  display_order?: number;
}

export interface CourseSkillsSelectorProps {
  courseId: string;
  selectedSkills: CourseSkill[];
  onSkillsChange: (skills: CourseSkill[]) => void;
  disabled?: boolean;
}
