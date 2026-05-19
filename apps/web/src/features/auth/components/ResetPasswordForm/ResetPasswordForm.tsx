'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resetPasswordAction, validateResetTokenAction } from '../../actions/reset-password';
import { getResetPasswordSchema, type ResetPasswordFormData } from './ResetPasswordForm.schema';
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { PasswordInput } from '../PasswordInput';
import Link from 'next/link';

export function ResetPasswordForm() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
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

  // Validar token al cargar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token no proporcionado');
        setIsValidatingToken(false);
        return;
      }

      const result = await validateResetTokenAction(token);

      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenError(result.error || t('auth.resetPassword.validation.invalidToken'));
      }

      setIsValidatingToken(false);
    };

    validateToken();
  }, [token]);

  // Calcular fortaleza de contraseña
  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;

    const labels = ['', t('auth.resetPassword.strengthLabels.weak'), t('auth.resetPassword.strengthLabels.medium'), t('auth.resetPassword.strengthLabels.good'), t('auth.resetPassword.strengthLabels.strong')];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-accent'];

    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('newPassword', data.newPassword);

      const response = await resetPasswordAction(formData);

      if (response.error) {
        setResult({ type: 'error', message: response.error });
      } else {
        setResult({
          type: 'success',
          message: response.message || t('auth.resetPassword.success'),
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/auth?message=password-reset-success');
        }, 2000);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: t('auth.resetPassword.error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  // ESTADO: Validando token
  if (isValidatingToken) {
    return (
      <div className="w-full max-w-md mx-auto p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-accent" />
        <p className="text-gray-500 dark:text-white/60 font-medium">{t('auth.resetPassword.verifying')}</p>
      </div>
    );
  }

  // ESTADO: Token inválido
  if (!tokenValid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <div className="bg-white dark:bg-carbon-800 rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-500/30 p-8 sm:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500">
              <XCircle className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary dark:text-white mb-3">{t('auth.resetPassword.invalidTokenTitle')}</h1>
          <p className="text-gray-500 dark:text-white/60 mb-8">{tokenError}</p>
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="w-full px-6 py-3.5 rounded-xl bg-primary hover:bg-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('auth.resetPassword.requestNewLink')}
          </button>
        </div>
      </motion.div>
    );
  }

  // ESTADO: Formulario principal
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
              <Lock className="w-8 h-8" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-white mb-3">{t('auth.resetPassword.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-white/60">
            {t('auth.resetPassword.subtitle')}
          </p>
        </motion.div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nueva Contraseña */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary dark:text-white/90">
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

            {/* Indicador de fortaleza */}
            <AnimatePresence>
              {newPassword && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mt-2"
                >
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-gray-200 dark:bg-gray-500/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-white/60">
                    {t('auth.resetPassword.strength')}: <span className={passwordStrength.strength > 2 ? 'text-accent' : ''}>{passwordStrength.label}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Requisitos */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
              {[
                { label: t('auth.resetPassword.requirements.minChars'), test: newPassword.length >= 8 },
                { label: t('auth.resetPassword.requirements.uppercase'), test: /[A-Z]/.test(newPassword) },
                { label: t('auth.resetPassword.requirements.lowercase'), test: /[a-z]/.test(newPassword) },
                { label: t('auth.resetPassword.requirements.number'), test: /[0-9]/.test(newPassword) },
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs font-medium transition-colors ${req.test ? 'text-accent' : 'text-gray-500 dark:text-white/40'}`}>
                  <CheckCircle className={`w-3 h-3 ${req.test ? 'opacity-100' : 'opacity-30'}`} />
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary dark:text-white/90">
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

          {/* Mensaje de resultado */}
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

          {/* Botón Submit */}
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
                <span>{t('auth.resetPassword.updating')}</span>
              </>
            ) : (
              <span>{t('auth.resetPassword.update')}</span>
            )}
          </motion.button>
          
          <div className="text-center pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-accent dark:text-white/60 dark:hover:text-accent transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>{t('auth.resetPassword.backToLogin')}</span>
            </Link>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
