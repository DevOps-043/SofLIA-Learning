import { AnimatePresence, motion } from 'framer-motion';
import { Check, Moon, Sun } from 'lucide-react';
import type { Theme } from '@/core/stores/themeStore';

interface ThemeSelectorProps {
  isOpen: boolean;
  theme: Theme;
  onOpenChange: (isOpen: boolean) => void;
  onOtherDropdownClose: () => void;
  onThemeChange: (theme: Theme) => void;
}

const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
];

export function ThemeSelector({
  isOpen,
  theme,
  onOpenChange,
  onOtherDropdownClose,
  onThemeChange,
}: ThemeSelectorProps) {
  return (
    <div className="relative theme-dropdown">
      <motion.button
        onClick={() => {
          onOpenChange(!isOpen);
          onOtherDropdownClose();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-gray-100 hover:text-primary dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-carbon-800"
          >
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const isSelected = theme === value;

              return (
                <motion.button
                  key={value}
                  onClick={() => {
                    onThemeChange(value);
                    onOpenChange(false);
                  }}
                  whileHover={{ x: 4 }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${isSelected
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/5'
                    }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{label}</span>
                  {isSelected && <Check size={16} className="ml-auto text-accent" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
