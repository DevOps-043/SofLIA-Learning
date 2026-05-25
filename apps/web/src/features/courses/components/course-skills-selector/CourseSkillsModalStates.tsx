import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

export function CourseSkillsLoadingState() {
  const { t } = useTranslation("common");

  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-gray-500 dark:text-white/60">
        {t("courseSkillsSelector.loading")}
      </p>
    </div>
  );
}

interface CourseSkillsEmptyStateProps {
  hasFilters: boolean;
}

export function CourseSkillsEmptyState({ hasFilters }: CourseSkillsEmptyStateProps) {
  const { t } = useTranslation("common");

  return (
    <div className="py-12 text-center">
      <AcademicCapIcon className="mx-auto mb-3 h-12 w-12 text-gray-500 dark:text-white/40" />
      <p className="text-sm font-medium text-gray-500 dark:text-white/60">
        {t(hasFilters ? "courseSkillsSelector.noResults" : "courseSkillsSelector.allSelected")}
      </p>
    </div>
  );
}
