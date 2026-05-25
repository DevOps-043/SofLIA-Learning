import { AcademicCapIcon } from "@heroicons/react/24/outline";
import type { Skill } from "./types";

interface SkillIconProps {
  skill: Skill;
}

export function SkillIcon({ skill }: SkillIconProps) {
  if (skill.icon_url) {
    return (
      <img
        alt={skill.name}
        className="h-6 w-6 rounded-lg object-cover"
        src={skill.icon_url}
      />
    );
  }

  if (skill.icon_name) {
    return (
      <div
        className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: skill.color || "var(--color-accent)" }}
      >
        {skill.icon_name.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent">
      <AcademicCapIcon className="h-4 w-4 text-white" />
    </div>
  );
}
