import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAvailableSkillsApi, fetchCourseSkillsApi } from "./skill-api";
import type { CourseSkill, CourseSkillsSelectorProps, Skill } from "./types";

export function useCourseSkillsSelector({
  courseId,
  selectedSkills,
  onSkillsChange,
}: CourseSkillsSelectorProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const refreshAvailableSkills = useCallback(async () => {
    try {
      setIsLoading(true);
      setAvailableSkills(await fetchAvailableSkillsApi());
    } catch (error) {
      techDebtLogger.error("Error fetching skills:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCourseSkills = useCallback(async () => {
    if (!courseId || courseId === "new") return;

    try {
      const skills = await fetchCourseSkillsApi(courseId);
      if (skills.length) onSkillsChange(skills);
    } catch (error) {
      techDebtLogger.error("Error fetching course skills:", error);
    }
  }, [courseId, onSkillsChange]);

  useEffect(() => {
    void refreshAvailableSkills();
  }, [refreshAvailableSkills]);

  useEffect(() => {
    void refreshCourseSkills();
  }, [refreshCourseSkills]);

  const filteredSkills = useMemo(() => availableSkills.filter((skill) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      skill.name.toLowerCase().includes(normalizedSearch) ||
      skill.description?.toLowerCase().includes(normalizedSearch);
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    const notSelected = !selectedSkills.some((item) => item.skill_id === skill.skill_id);
    return matchesSearch && matchesCategory && notSelected;
  }), [availableSkills, searchTerm, selectedCategory, selectedSkills]);

  const categories = useMemo(
    () => Array.from(new Set(availableSkills.map((skill) => skill.category))),
    [availableSkills],
  );

  const handleAddSkill = useCallback((skill: Skill) => {
    const newSkill: CourseSkill = {
      ...skill,
      is_primary: false,
      is_required: true,
      proficiency_level: "beginner",
      display_order: selectedSkills.length,
    };
    onSkillsChange([...selectedSkills, newSkill]);
    setSearchTerm("");
    setShowAddModal(false);
  }, [onSkillsChange, selectedSkills]);

  const handleRemoveSkill = useCallback((skillId: string) => {
    onSkillsChange(selectedSkills.filter((skill) => skill.skill_id !== skillId));
  }, [onSkillsChange, selectedSkills]);

  return {
    categories,
    filteredSkills,
    handleAddSkill,
    handleRemoveSkill,
    isLoading,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    setShowAddModal,
    showAddModal,
  };
}
