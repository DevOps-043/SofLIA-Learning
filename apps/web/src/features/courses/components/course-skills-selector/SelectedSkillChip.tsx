import { motion } from "framer-motion";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SkillIcon } from "./SkillIcon";
import type { CourseSkill } from "./types";

interface SelectedSkillChipProps {
  disabled?: boolean;
  index: number;
  onRemove: (skillId: string) => void;
  skill: CourseSkill;
}

export function SelectedSkillChip({
  disabled,
  index,
  onRemove,
  skill,
}: SelectedSkillChipProps) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="group relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-all duration-200 hover:border-accent/50 dark:border-white/10 dark:bg-gray-900"
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ delay: index * 0.05 }}
    >
      <SkillIcon skill={skill} />
      <span className="text-sm font-medium text-primary dark:text-white">{skill.name}</span>
      {skill.is_primary && <StarIcon className="h-4 w-4 fill-warning text-warning" />}
      {!disabled && (
        <motion.button
          className="ml-1 rounded p-1 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onRemove(skill.skill_id)}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <XMarkIcon className="h-3 w-3 text-red-500 dark:text-red-400" />
        </motion.button>
      )}
    </motion.div>
  );
}
