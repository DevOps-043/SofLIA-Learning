import { motion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/outline";
import { SkillIcon } from "./SkillIcon";
import type { Skill } from "./types";

interface CourseSkillsOptionCardProps {
  index: number;
  onAddSkill: (skill: Skill) => void;
  skill: Skill;
}

export function CourseSkillsOptionCard({
  index,
  onAddSkill,
  skill,
}: CourseSkillsOptionCardProps) {
  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-all duration-200 hover:border-accent hover:bg-accent/5 dark:border-white/10 dark:bg-gray-900 dark:hover:bg-accent/10"
      initial={{ opacity: 0, y: 10 }}
      key={skill.skill_id}
      onClick={() => onAddSkill(skill)}
      transition={{ delay: index * 0.03 }}
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <SkillIcon skill={skill} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-primary dark:text-white">
          {skill.name}
        </div>
        {skill.description && (
          <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-white/60">
            {skill.description}
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500 dark:text-white/50">
          {skill.category}
          {skill.level && ` - ${skill.level}`}
        </div>
      </div>
      <div className="shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 dark:bg-accent/20">
          <PlusIcon className="h-4 w-4 text-accent" />
        </div>
      </div>
    </motion.button>
  );
}
