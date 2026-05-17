import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileMenuButton({ isOpen, onToggle }: MobileMenuButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="rounded-xl p-2 text-primary transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/10 lg:hidden"
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </motion.button>
  );
}
