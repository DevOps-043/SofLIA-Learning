import { motion } from 'framer-motion';

import { heroBusinessStats } from './hero-business.config';

export function HeroBusinessStats() {
  return (
    <motion.div
      variants={{ hidden: {}, visible: {} }}
      className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8"
    >
      {heroBusinessStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <div className="text-3xl font-bold text-primary dark:text-white">{stat.value}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-white/70">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}
