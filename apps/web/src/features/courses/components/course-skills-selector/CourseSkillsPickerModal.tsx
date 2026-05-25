import { AnimatePresence, motion } from "framer-motion";
import { CourseSkillsEmptyState, CourseSkillsLoadingState } from "./CourseSkillsModalStates";
import { CourseSkillsModalFilters } from "./CourseSkillsModalFilters";
import { CourseSkillsModalHeader } from "./CourseSkillsModalHeader";
import { CourseSkillsOptionCard } from "./CourseSkillsOptionCard";
import type { Skill } from "./types";

interface CourseSkillsPickerModalProps {
  categories: string[];
  filteredSkills: Skill[];
  isLoading: boolean;
  isOpen: boolean;
  onAddSkill: (skill: Skill) => void;
  onClose: () => void;
  searchTerm: string;
  selectedCategory: string;
  setSearchTerm: (value: string) => void;
  setSelectedCategory: (value: string) => void;
}

export function CourseSkillsPickerModal(props: CourseSkillsPickerModalProps) {
  const hasFilters = Boolean(props.searchTerm) || props.selectedCategory !== "all";

  return (
    <AnimatePresence>
      {props.isOpen && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm dark:bg-black/80"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={props.onClose}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-dvh items-center justify-center p-4">
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative flex max-h-[85dvh] w-full max-w-3xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-800"
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(event) => event.stopPropagation()}
                transition={{ duration: 0.3 }}
              >
                <CourseSkillsModalHeader onClose={props.onClose} />
                <CourseSkillsModalFilters {...props} />
                <div className="flex-1 overflow-y-auto p-5">
                  {props.isLoading ? (
                    <CourseSkillsLoadingState />
                  ) : props.filteredSkills.length === 0 ? (
                    <CourseSkillsEmptyState hasFilters={hasFilters} />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {props.filteredSkills.map((skill, index) => (
                        <CourseSkillsOptionCard
                          index={index}
                          key={skill.skill_id}
                          onAddSkill={props.onAddSkill}
                          skill={skill}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
