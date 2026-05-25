import { motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface CourseSkillsModalFiltersProps {
  categories: string[];
  searchTerm: string;
  selectedCategory: string;
  setSearchTerm: (value: string) => void;
  setSelectedCategory: (value: string) => void;
}

export function CourseSkillsModalFilters({
  categories,
  searchTerm,
  selectedCategory,
  setSearchTerm,
  setSelectedCategory,
}: CourseSkillsModalFiltersProps) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4 border-b border-gray-200 bg-gray-100/40 p-5 dark:border-white/10 dark:bg-gray-900">
      <div className="group relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-accent dark:text-white/60" />
        <input
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-primary placeholder:text-gray-500 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/60"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("courseSkillsSelector.searchPlaceholder")}
          type="text"
          value={searchTerm}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <CategoryButton
          isActive={selectedCategory === "all"}
          label={t("courseSkillsSelector.allCategories")}
          onClick={() => setSelectedCategory("all")}
        />
        {categories.map((category) => (
          <CategoryButton
            isActive={selectedCategory === category}
            key={category}
            label={category}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryButtonProps {
  isActive: boolean;
  label: string;
  onClick: () => void;
}

function CategoryButton({ isActive, label, onClick }: CategoryButtonProps) {
  return (
    <motion.button
      className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
        isActive
          ? "bg-accent text-white shadow-md"
          : "border border-gray-200 bg-white text-gray-500 hover:border-accent/50 dark:border-white/10 dark:bg-gray-900 dark:text-white/60"
      }`}
      onClick={onClick}
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}
