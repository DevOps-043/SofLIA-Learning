import { motion } from "framer-motion";
import { AcademicCapIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface CourseSkillsModalHeaderProps {
  onClose: () => void;
}

export function CourseSkillsModalHeader({ onClose }: CourseSkillsModalHeaderProps) {
  const { t } = useTranslation("common");

  return (
    <div className="relative border-b border-primary/20 bg-primary px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <AcademicCapIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {t("courseSkillsSelector.modalTitle")}
            </h3>
            <p className="text-xs text-white/70">
              {t("courseSkillsSelector.modalSubtitle")}
            </p>
          </div>
        </div>

        <motion.button
          className="rounded-lg p-2 text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white"
          onClick={onClose}
          type="button"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <XMarkIcon className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
