import { motion } from 'framer-motion';

import { fadeIn, slideUp, staggerContainer } from '../../../../shared/utils/animations';

interface ComparisonHeaderProps {
  title: string;
  subtitle: string;
}

export function ComparisonHeader({ title, subtitle }: ComparisonHeaderProps) {
  return (
    <motion.div
      className="mb-16 text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
    >
      <motion.h2 className="mb-6 text-4xl font-bold lg:text-5xl" variants={slideUp}>
        {title}
      </motion.h2>
      <motion.p className="mx-auto max-w-3xl text-xl" variants={fadeIn}>
        {subtitle}
      </motion.p>
    </motion.div>
  );
}
