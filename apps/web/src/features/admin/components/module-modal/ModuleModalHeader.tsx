import { motion } from 'framer-motion';
import { BookOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { TFunction } from 'i18next';

interface ModuleModalHeaderProps {
  isEditing: boolean;
  onClose: () => void;
  t: TFunction<'admin'>;
}

export function ModuleModalHeader({ isEditing, onClose, t }: ModuleModalHeaderProps) {
  return (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="relative overflow-hidden border-b border-primary/20 bg-gradient-to-r from-primary via-primary/95 to-primary/90 px-4 py-5 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:px-6">
      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }} />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="w-12 h-12 rounded-xl bg-accent/20 dark:bg-accent/30 flex items-center justify-center shadow-lg shadow-accent/20">
            <BookOpenIcon className="h-6 w-6 text-accent" />
          </motion.div>
          <div>
            <motion.h3 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-xl font-bold text-white">
              {isEditing ? t('workshops.editor.modules.editModule') : t('workshops.editor.modules.createModule')}
            </motion.h3>
            <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs text-white/70 mt-0.5">
              {isEditing ? t('workshops.editor.modules.editModuleDesc') : t('workshops.editor.modules.createModuleDesc')}
            </motion.p>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative">
          <XMarkIcon className="h-5 w-5 relative z-10" />
        </motion.button>
      </div>
    </motion.div>
  );
}
