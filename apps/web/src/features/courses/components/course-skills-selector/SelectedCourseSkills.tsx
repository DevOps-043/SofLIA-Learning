import { useTranslation } from "react-i18next";
import { SelectedSkillChip } from "./SelectedSkillChip";
import type { CourseSkill } from "./types";

interface SelectedCourseSkillsProps {
  disabled?: boolean;
  onRemoveSkill: (skillId: string) => void;
  selectedSkills: CourseSkill[];
}

export function SelectedCourseSkills({
  disabled,
  onRemoveSkill,
  selectedSkills,
}: SelectedCourseSkillsProps) {
  const { t } = useTranslation("common");

  if (selectedSkills.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-white/70">
          {t("courseSkillsSelector.selectedTitle", { count: selectedSkills.length })}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill, index) => (
          <SelectedSkillChip
            disabled={disabled}
            index={index}
            key={skill.skill_id}
            onRemove={onRemoveSkill}
            skill={skill}
          />
        ))}
      </div>
    </div>
  );
}
