'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mail,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { requestPasswordResetAction } from '../../actions/reset-password';
import { AuthExperience, authExperienceStyles } from '../AuthExperience';
import { HumanVerificationField } from '../HumanVerificationField';
import { TextInput } from '../TextInput';
import {
  getForgotPasswordSchema,
  type ForgotPasswordFormData,
} from './ForgotPasswordForm.schema';

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
          message:
            getPasswordResetMessage(response) ||
            t('auth.forgotPassword.success'),
        });
      }
    } catch {
      setResult({
        type: 'error',
        message: t('auth.forgotPassword.error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthExperience>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className={authExperienceStyles.content}
      >
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className={authExperienceStyles.header}
        >
          <div className={authExperienceStyles.iconBadge}>
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className={authExperienceStyles.title}>
            {t('auth.forgotPassword.title')}
          </h1>
          <p className={authExperienceStyles.subtitle}>
            {t('auth.forgotPassword.subtitle')}
          </p>
        </motion.header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={authExperienceStyles.form}
        >
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
            {result ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`${authExperienceStyles.status} ${
                  result.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <p>{result.message}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <HumanVerificationField onTokenChange={setCaptchaToken} />

          <motion.button
            type="submit"
            disabled={isLoading || result?.type === 'success'}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={authExperienceStyles.primaryButton}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>{t('auth.forgotPassword.sending')}</span>
              </>
            ) : (
              <span>{t('auth.forgotPassword.sendLink')}</span>
            )}
          </motion.button>

          <Link href="/auth" className={authExperienceStyles.backLink}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t('auth.forgotPassword.backToLogin')}</span>
          </Link>
        </form>
      </motion.div>
    </AuthExperience>
  );
}
