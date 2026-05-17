import type React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface SettingsSectionProps {
  children: React.ReactNode;
  delay: number;
  icon: LucideIcon;
  title: string;
}

export function SettingsSection({
  children,
  delay,
  icon: Icon,
  title
}: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-white/10"
    >
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-6 h-6 text-primary dark:text-accent" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </motion.div>
  );
}
