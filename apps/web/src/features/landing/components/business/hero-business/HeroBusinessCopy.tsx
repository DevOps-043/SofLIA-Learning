import type { HeroContent } from '@aprende-y-aplica/shared';
import { Button } from '@aprende-y-aplica/ui';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../../shared/utils/animations';
import { HeroBusinessStats } from './HeroBusinessStats';

interface HeroBusinessCopyProps {
  content: HeroContent;
}

export function HeroBusinessCopy({ content }: HeroBusinessCopyProps) {
  const { title, highlightWord, description, ctaText } = content;

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.h1
        className="text-5xl font-bold leading-tight text-primary dark:text-white lg:text-7xl"
        variants={slideUp}
      >
        <span>{title}</span>
        <br />
        <span className="text-accent">{highlightWord}</span>
      </motion.h1>

      <motion.p
        className="max-w-2xl text-xl leading-relaxed text-gray-600 dark:text-white/90"
        variants={fadeIn}
      >
        {description}
      </motion.p>

      <HeroBusinessStats />

      <motion.div variants={staggerItem} className="flex flex-col gap-4 pt-4 sm:flex-row">
        <Link href="#contact" className="flex-1">
          <Button
            size="lg"
            variant="primary"
            className="group relative w-full overflow-hidden bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {ctaText}
              <ArrowRight className="h-5 w-5 text-white" />
            </span>
          </Button>
        </Link>
        <Link href="/business/plans" className="flex-1">
          <Button
            size="lg"
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10 dark:border-accent dark:text-accent dark:hover:bg-accent/10"
          >
            Ver Precios
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
