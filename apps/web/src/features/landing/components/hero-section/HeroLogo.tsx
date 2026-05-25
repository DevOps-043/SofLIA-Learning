import { motion } from 'framer-motion';
import Image from 'next/image';

import { slideInFromRight } from '../../../../shared/utils/animations';

interface HeroLogoProps {
  disableHeavy: boolean;
}

export function HeroLogo({ disableHeavy }: HeroLogoProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInFromRight}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center"
    >
      <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[420px]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, ...(disableHeavy ? {} : { y: [0, -20, 0] }) }}
          transition={{
            scale: { delay: 0.2, duration: 0.5 },
            opacity: { delay: 0.2, duration: 0.5 },
            y: { delay: 0.7, duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative aspect-square w-full"
        >
          <Image src="/Logo.png" alt="SofLIA Logo" fill className="object-contain" priority />
        </motion.div>
      </div>
    </motion.div>
  );
}
