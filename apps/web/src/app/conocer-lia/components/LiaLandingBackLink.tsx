import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export function LiaLandingBackLink() {
  return (
    <div className="container mx-auto px-4 pt-8 relative z-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6C757D] dark:text-white/70 hover:text-[#0A2540] dark:hover:text-white transition-colors"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al inicio</span>
        </Link>
      </motion.div>
    </div>
  );
}
