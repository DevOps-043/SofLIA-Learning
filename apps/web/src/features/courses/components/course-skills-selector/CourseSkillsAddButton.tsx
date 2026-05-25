import { motion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface CourseSkillsAddButtonProps {
  onClick: () => void;
}

export function CourseSkillsAddButton({ onClick }: CourseSkillsAddButtonProps) {
  const { t } = useTranslation("common");

  return (
    <motion.button
      className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-all duration-200 hover:bg-accent/20 dark:border-accent/30 dark:bg-accent/20 dark:hover:bg-accent/30"
      onClick={onClick}
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <PlusIcon className="h-4 w-4" />
      {t("courseSkillsSelector.addButton")}
    </motion.button>
  );
}
