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
import { HumanVerificationField } from '../HumanVerificationField';
import Link from 'next/link';

function getPasswordResetError(
  response: Awaited<ReturnType<typeof requestPasswordResetAction>>,
) {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof response.error === 'string'
  )
    ? response.error
    : null;
}

function getPasswordResetMessage(
  response: Awaited<ReturnType<typeof requestPasswordResetAction>>,
) {
  return (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof response.message === 'string'
  )
    ? response.message
    : null;
}

export function ForgotPasswordForm() {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
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
      formData.append('captchaToken', captchaToken);

      const response = await requestPasswordResetAction(formData);
      const responseError = getPasswordResetError(response);

      if (responseError) {
        setResult({ type: 'error', message: responseError });
      } else {
        setResult({
          type: 'success',
          message: getPasswordResetMessage(response) || t('auth.forgotPassword.success'),
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white dark:from-carbon-900 dark:via-carbon-950 dark:to-carbon-900">
      {/* Fondo animado con formas geométricas (Consistent with Auth Page) */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[linear-gradient(var(--color-primary)_1px,transparent_1px),linear-gradient(90deg,var(--color-primary)_1px,transparent_1px)] bg-[length:50px_50px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white/80 dark:bg-carbon-800/90 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-500/30 p-8 sm:p-10">
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
              className="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center text-accent"
            >
              <Mail className="w-8 h-8" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-white mb-3">
            {t('auth.forgotPassword.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-white/60">
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

          <HumanVerificationField onTokenChange={setCaptchaToken} />

          <motion.button
            type="submit"
            disabled={isLoading || result?.type === 'success'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-primary hover:bg-primary text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-accent dark:text-white/60 dark:hover:text-accent transition-colors group"
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
