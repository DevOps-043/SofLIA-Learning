"use client";

import { CourseSkillsAddButton } from "./course-skills-selector/CourseSkillsAddButton";
import { CourseSkillsPickerModal } from "./course-skills-selector/CourseSkillsPickerModal";
import { SelectedCourseSkills } from "./course-skills-selector/SelectedCourseSkills";
import { useCourseSkillsSelector } from "./course-skills-selector/useCourseSkillsSelector";
import type { CourseSkillsSelectorProps } from "./course-skills-selector/types";

export type { CourseSkill, Skill } from "./course-skills-selector/types";

export function CourseSkillsSelector(props: CourseSkillsSelectorProps) {
  const selector = useCourseSkillsSelector(props);

  return (
    <div className="space-y-4">
      <SelectedCourseSkills
        disabled={props.disabled}
        onRemoveSkill={selector.handleRemoveSkill}
        selectedSkills={props.selectedSkills}
      />

      {!props.disabled && (
        <CourseSkillsAddButton onClick={() => selector.setShowAddModal(true)} />
      )}

      <CourseSkillsPickerModal
        categories={selector.categories}
        filteredSkills={selector.filteredSkills}
        isLoading={selector.isLoading}
        isOpen={selector.showAddModal}
        onAddSkill={selector.handleAddSkill}
        onClose={() => selector.setShowAddModal(false)}
        searchTerm={selector.searchTerm}
        selectedCategory={selector.selectedCategory}
        setSearchTerm={selector.setSearchTerm}
        setSelectedCategory={selector.setSelectedCategory}
      />
    </div>
  );
}
