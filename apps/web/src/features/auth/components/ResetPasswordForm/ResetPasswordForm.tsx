'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Lock,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  resetPasswordAction,
  resetSupabaseRecoveryPasswordAction,
  validateResetTokenAction,
} from '../../actions/reset-password';
import { AuthExperience, authExperienceStyles } from '../AuthExperience';
import { PasswordInput } from '../PasswordInput';
import {
  establishSupabaseRecoverySession,
  parseRecoveryUrlError,
} from './recovery-session.helpers';
import {
  getResetPasswordSchema,
  type ResetPasswordFormData,
} from './ResetPasswordForm.schema';

export function ResetPasswordForm() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const recoveryCode = searchParams.get('code');
  const recoveryMode = searchParams.get('mode');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState<'legacy' | 'supabase'>('legacy');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const resetPasswordSchema = useMemo(() => getResetPasswordSchema(t), [t]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });
  const newPassword = watch('newPassword', '');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        const urlError = parseRecoveryUrlError(
          window.location.search,
          window.location.hash,
        );

        if (urlError) {
          setTokenError(
            urlError === 'expired'
              ? t('auth.resetPassword.validation.expiredToken')
              : t('auth.resetPassword.validation.invalidToken'),
          );
          setIsValidatingToken(false);
          return;
        }

        const hasSupabaseRecovery =
          recoveryMode === 'supabase' ||
          Boolean(recoveryCode) ||
          window.location.hash.includes('access_token');

        if (!hasSupabaseRecovery) {
          setTokenError(t('auth.resetPassword.validation.invalidToken'));
          setIsValidatingToken(false);
          return;
        }

        const supabase = createBrowserSupabaseClient();
        const hasSession = await establishSupabaseRecoverySession(
          supabase,
          recoveryCode,
        );

        if (!hasSession) {
          setTokenError(t('auth.resetPassword.validation.invalidToken'));
          setIsValidatingToken(false);
          return;
        }

        setResetMode('supabase');
        setTokenValid(true);
        setIsValidatingToken(false);
        return;
      }

      setResetMode('legacy');
      const validation = await validateResetTokenAction(token);
      if (validation.valid) {
        setTokenValid(true);
      } else {
        setTokenError(
          validation.error ||
            t('auth.resetPassword.validation.invalidToken'),
        );
      }
      setIsValidatingToken(false);
    };

    validateToken();
  }, [recoveryCode, recoveryMode, token, t]);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[a-z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;

    const labels = [
      '',
      t('auth.resetPassword.strengthLabels.weak'),
      t('auth.resetPassword.strengthLabels.medium'),
      t('auth.resetPassword.strengthLabels.good'),
      t('auth.resetPassword.strengthLabels.strong'),
    ];
    const colors = [
      '',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-accent',
    ];

    return { strength, label: labels[strength], color: colors[strength] };
  }, [newPassword, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (resetMode === 'legacy' && !token) return;

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('newPassword', data.newPassword);
      if (token) formData.append('token', token);

      const response =
        resetMode === 'supabase'
          ? await resetSupabaseRecoveryPasswordAction(formData)
          : await resetPasswordAction(formData);
      const responseError =
        'error' in response && typeof response.error === 'string'
          ? response.error
          : null;
      const responseMessage =
        'message' in response && typeof response.message === 'string'
          ? response.message
          : null;

      if (responseError) {
        setResult({ type: 'error', message: responseError });
      } else {
        setResult({
          type: 'success',
          message: responseMessage || t('auth.resetPassword.success'),
        });
        window.setTimeout(() => {
          router.push('/auth?message=password-reset-success');
        }, 2000);
      }
    } catch {
      setResult({
        type: 'error',
        message: t('auth.resetPassword.error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <AuthExperience>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
          <p className="text-sm font-medium opacity-60">
            {t('auth.resetPassword.verifying')}
          </p>
        </div>
      </AuthExperience>
    );
  }

  if (!tokenValid) {
    return (
      <AuthExperience>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={authExperienceStyles.content}
        >
          <header className={authExperienceStyles.header}>
            <div className={`${authExperienceStyles.iconBadge} text-red-500`}>
              <XCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className={authExperienceStyles.title}>
              {t('auth.resetPassword.invalidTokenTitle')}
            </h1>
            <p className={authExperienceStyles.subtitle}>{tokenError}</p>
          </header>
          <button
            type="button"
            onClick={() => router.push('/auth/forgot-password')}
            className={`${authExperienceStyles.primaryButton} w-full`}
          >
            {t('auth.resetPassword.requestNewLink')}
          </button>
        </motion.div>
      </AuthExperience>
    );
  }

  const requirements = [
    {
      label: t('auth.resetPassword.requirements.minChars'),
      test: newPassword.length >= 8,
    },
    {
      label: t('auth.resetPassword.requirements.uppercase'),
      test: /[A-Z]/.test(newPassword),
    },
    {
      label: t('auth.resetPassword.requirements.lowercase'),
      test: /[a-z]/.test(newPassword),
    },
    {
      label: t('auth.resetPassword.requirements.number'),
      test: /[0-9]/.test(newPassword),
    },
  ];

  return (
    <AuthExperience>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className={authExperienceStyles.content}
      >
        <header className={authExperienceStyles.header}>
          <div className={authExperienceStyles.iconBadge}>
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className={authExperienceStyles.title}>
            {t('auth.resetPassword.title')}
          </h1>
          <p className={authExperienceStyles.subtitle}>
            {t('auth.resetPassword.subtitle')}
          </p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={authExperienceStyles.form}
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">
              {t('auth.resetPassword.newPasswordLabel')}
            </label>
            <PasswordInput
              id="newPassword"
              placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
              error={errors.newPassword?.message}
              focusedField={focusedField}
              onFocus={() => setFocusedField('newPassword')}
              {...register('newPassword')}
            />

            <AnimatePresence>
              {newPassword ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-1"
                >
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={`h-1.5 flex-1 rounded-full ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-gray-500/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs opacity-60">
                    {t('auth.resetPassword.strength')}: {passwordStrength.label}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {requirements.map((requirement) => (
                <div
                  key={requirement.label}
                  className={`flex items-center gap-2 text-xs ${
                    requirement.test ? 'text-accent' : 'opacity-40'
                  }`}
                >
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{requirement.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">
              {t('auth.resetPassword.confirmPasswordLabel')}
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
              error={errors.confirmPassword?.message}
              focusedField={focusedField}
              onFocus={() => setFocusedField('confirmPassword')}
              {...register('confirmPassword')}
            />
          </div>

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
                <span>{t('auth.resetPassword.updating')}</span>
              </>
            ) : (
              <span>{t('auth.resetPassword.update')}</span>
            )}
          </motion.button>

          <Link href="/auth" className={authExperienceStyles.backLink}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t('auth.resetPassword.backToLogin')}</span>
          </Link>
        </form>
      </motion.div>
    </AuthExperience>
  );
}
