import { motion } from 'framer-motion';
import { Loader2, UserPlus } from 'lucide-react';

type Translate = (key: string) => string;

export function RegisterSubmitButton({
  t,
  isPending,
}: {
  t: Translate;
  isPending: boolean;
}) {
  return (
    <motion.button
      type="submit"
      disabled={isPending}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
    >
      {isPending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('auth.register.creating')}</span>
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          <span>{t('auth.register.create')}</span>
        </>
      )}
    </motion.button>
  );
}
