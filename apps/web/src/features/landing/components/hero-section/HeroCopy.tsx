import type { HeroContent } from '@aprende-y-aplica/shared';
import { Button } from '@aprende-y-aplica/ui';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../shared/utils/animations';

interface HeroCopyProps {
  content: HeroContent;
  disableHeavy: boolean;
}

export function HeroCopy({ content, disableHeavy }: HeroCopyProps) {
  const { title, highlightWord, description, ctaText } = content;

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.h1
        className="text-4xl font-bold leading-tight text-primary dark:text-white lg:text-6xl xl:text-7xl"
        variants={slideUp}
      >
        <span>{title}</span>
        <br />
        <motion.span className="text-accent">{highlightWord}</motion.span>
      </motion.h1>

      <motion.p
        className="max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-white/90 lg:text-xl"
        variants={fadeIn}
      >
        {description}
      </motion.p>

      <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:flex-row">
        <HeroButton href="/auth" variant="primary">
          {ctaText}
          <motion.div
            animate={disableHeavy ? {} : { x: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight className="h-5 w-5 text-white" />
          </motion.div>
        </HeroButton>

        <HeroButton href="/conocer-lia" variant="outline">
          Conoce al Tutor
          <motion.div
            animate={disableHeavy ? {} : { rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight className="h-5 w-5" />
          </motion.div>
        </HeroButton>
      </motion.div>
    </motion.div>
  );
}

function HeroButton({
  children,
  href,
  variant,
}: {
  children: ReactNode;
  href: string;
  variant: 'outline' | 'primary';
}) {
  const isPrimary = variant === 'primary';
  const className = isPrimary
    ? 'group relative w-full overflow-hidden bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/50 sm:w-auto'
    : 'group relative w-full overflow-hidden border-2 border-accent bg-transparent text-accent shadow-lg shadow-accent/25 hover:bg-accent/10 hover:text-accent hover:shadow-accent/50 sm:w-auto';

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link href={href}>
        <Button size="lg" variant={variant} className={className}>
          <span className="relative z-10 flex items-center gap-2">{children}</span>
        </Button>
      </Link>
    </motion.div>
  );
}
