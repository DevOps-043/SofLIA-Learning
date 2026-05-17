import { AnimatePresence, motion } from 'framer-motion';
import { Trans } from 'react-i18next';
import type { FieldError, UseFormRegister } from 'react-hook-form';
import type { TFunction } from 'i18next';
import type { RegisterFormData } from '../../types/auth.types';

type Translate = TFunction<'common'>;

interface RegisterTermsFieldProps {
  t: Translate;
  acceptTerms: boolean;
  error?: FieldError;
  register: UseFormRegister<RegisterFormData>;
  onOpenLegalModal: () => void;
}

export function RegisterTermsField({
  t,
  acceptTerms,
  error,
  register,
  onOpenLegalModal,
}: RegisterTermsFieldProps) {
  const createLegalLink = (key: string) => (
    <button
      key={key}
      type="button"
      onClick={onOpenLegalModal}
      className="text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 font-medium transition-colors"
    />
  );

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4 }} className="flex items-start gap-2.5 pt-1">
        <input type="checkbox" id="acceptTerms" {...register('acceptTerms')} className="sr-only" />
        <label htmlFor="acceptTerms" className="flex items-start gap-2.5 cursor-pointer group">
          <motion.div
            className={`relative w-5 h-5 rounded-lg border-2 transition-all duration-200 flex-shrink-0 mt-0.5 ${
              acceptTerms
                ? 'bg-[#00D4B3] border-[#00D4B3]'
                : 'bg-white dark:bg-[#1E2329] border-[#6C757D] dark:border-[#6C757D]/50'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence>
              {acceptTerms && (
                <motion.svg initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
          <span className="text-xs sm:text-sm text-[#0A2540] dark:text-white/80 leading-relaxed">
            <Trans
              i18nKey="auth.register.acceptTerms"
              t={t}
              components={[createLegalLink('terms'), createLegalLink('privacy')]}
            />
          </span>
        </label>
      </motion.div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 dark:text-red-400 font-medium -mt-2">
          {error.message}
        </motion.p>
      )}
    </>
  );
}
