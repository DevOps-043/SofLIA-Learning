import { Card, CardContent } from '@aprende-y-aplica/ui';
import { motion } from 'framer-motion';

import { heroBusinessBenefits } from './hero-business.config';

export function HeroBusinessBenefitsCard() {
  return (
    <motion.div initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
      >
        <Card
          variant="glassmorphism"
          className="relative h-fit overflow-hidden border border-gray-200 bg-white dark:border-gray-500/30 dark:bg-gray-800/95"
        >
          <CardContent className="relative z-10 p-8">
            <motion.h3
              className="mb-6 text-2xl font-bold text-primary dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Beneficios Empresariales
            </motion.h3>
            <div className="space-y-4">
              {heroBusinessBenefits.map((benefit, index) => (
                <BusinessBenefitItem key={benefit.label} benefit={benefit} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function BusinessBenefitItem({
  benefit,
  index,
}: {
  benefit: (typeof heroBusinessBenefits)[number];
  index: number;
}) {
  const Icon = benefit.icon;

  return (
    <motion.div
      className="hero-benefit-text group flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
      whileHover={{ x: 8 }}
    >
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent">
        <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-primary dark:text-white/90">{benefit.label}</span>
    </motion.div>
  );
}
