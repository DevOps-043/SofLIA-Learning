'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { requestPasswordResetAction } from '../../actions/reset-password';
import { getForgotPasswordSchema, type ForgotPasswordFormData } from './ForgotPasswordForm.schema';
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { TextInput } from '../TextInput';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const forgotPasswordSchema = useMemo(() => getForgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('email', data.email);

      const response = await requestPasswordResetAction(formData);

      if (response.error) {
        setResult({ type: 'error', message: response.error });
      } else {
        setResult({
          type: 'success',
          message: response.message || t('auth.forgotPassword.success'),
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: t('auth.forgotPassword.error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
      {/* Fondo animado con formas geométricas (Consistent with Auth Page) */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#0A2540]/5 dark:bg-[#0A2540]/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[linear-gradient(#0A2540_1px,transparent_1px),linear-gradient(90deg,#0A2540_1px,transparent_1px)] bg-[length:50px_50px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white/80 dark:bg-[#1E2329]/90 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 sm:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center text-[#00D4B3]"
            >
              <Mail className="w-8 h-8" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-3">
            {t('auth.forgotPassword.title')}
          </h1>
          <p className="text-sm sm:text-base text-[#6C757D] dark:text-white/60">
            {t('auth.forgotPassword.subtitle')}
          </p>
        </motion.div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextInput
            id="email"
            type="email"
            label={t('auth.forgotPassword.emailLabel')}
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            icon={Mail}
            error={errors.email?.message}
            focusedField={focusedField}
            onFocus={() => setFocusedField('email')}
            {...register('email')}
          />

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{result.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isLoading || result?.type === 'success'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('auth.forgotPassword.sending')}</span>
              </>
            ) : (
              <span>{t('auth.forgotPassword.sendLink')}</span>
            )}
          </motion.button>

          <div className="text-center pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6C757D] hover:text-[#00D4B3] dark:text-white/60 dark:hover:text-[#00D4B3] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>{t('auth.forgotPassword.backToLogin')}</span>
            </Link>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
