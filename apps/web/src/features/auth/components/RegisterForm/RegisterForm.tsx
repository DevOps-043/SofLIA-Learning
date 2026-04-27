'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Mail, Phone, Loader2, UserPlus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { RegisterFormData } from '../../types/auth.types';
import { registerSchema } from './RegisterForm.schema';
import { registerAction } from '../../actions/register';
import { USER_GENDER_VALUES, type UserGender } from '../../../../lib/schemas/user-demographics.schema';
import { ToastNotification } from '../../../../core/components/ToastNotification';
import { TextInput } from '../TextInput';
import { PasswordInput } from '../PasswordInput';
import { SocialLoginButtons } from '../SocialLoginButtons';
import { SelectField, SelectOption } from '../../../../core/components/SelectField/SelectField';
import { COUNTRIES } from '../CountrySelector/CountrySelector.data';
import { useAuthTab } from '../AuthTabs/AuthTabContext';

const LegalDocumentsModal = dynamic(() => import('../LegalDocumentsModal').then(mod => ({ default: mod.LegalDocumentsModal })), {
  ssr: false
});

export function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('MX');
  const [dialCode, setDialCode] = useState('+52');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setActiveTab } = useAuthTab();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      countryCode: 'MX',
      phoneNumber: '',
      dateOfBirth: '',
      gender: null,
      email: '',
      confirmEmail: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const acceptTerms = watch('acceptTerms');
  const selectedGender = watch('gender');
  const maxDateOfBirth = new Date().toISOString().slice(0, 10);

  const countryOptions: SelectOption[] = COUNTRIES.map(country => ({
    value: country.code,
    label: `${country.flag} ${country.dialCode} ${country.name}`,
    flag: country.flag,
  }));
  const genderOptions: SelectOption[] = USER_GENDER_VALUES.map(gender => ({
    value: gender,
    label: t(`demographics.gender.options.${gender}`),
  }));

  const handleCountryChange = (countryCode: string | number) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountryCode(country.code);
      setDialCode(country.dialCode);
      setValue('countryCode', country.code);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else if (value === null || value === undefined) {
          formData.append(key, '');
        } else {
          formData.append(key, String(value));
        }
      });

      try {
        const result = await registerAction(formData);
        
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.message || 'Cuenta creada exitosamente');
        }
      } catch (error) {
        setError('Error inesperado al crear la cuenta');
      }
    });
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/auth?tab=login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-xl dark:shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-5"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] dark:text-white mb-1">
              Crear cuenta
            </h1>
            <p className="text-xs sm:text-sm text-[#6C757D] dark:text-white/60">
              Únete y comienza tu aprendizaje
            </p>
          </motion.div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-[#10B981]/10 dark:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] dark:text-[#10B981] text-sm font-medium"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <TextInput
                  id="firstName"
                  label="Nombre"
                  placeholder="Juan"
                  icon={User}
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <TextInput
                  id="lastName"
                  label="Apellido"
                  placeholder="Pérez"
                  icon={User}
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <TextInput
                id="username"
                label="Usuario"
                placeholder="juanperez"
                icon={User}
                  error={errors.username?.message}
                  {...register('username')}
              />
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <TextInput
                  id="email"
                  label="Correo"
                  placeholder="tu@email.com"
                  icon={Mail}
                  error={errors.email?.message}
                  type="email"
                  onPaste={(e) => e.preventDefault()}
                  {...register('email')}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <TextInput
                  id="confirmEmail"
                  label="Confirmar"
                  placeholder="tu@email.com"
                  icon={Mail}
                  error={errors.confirmEmail?.message}
                  type="email"
                  onPaste={(e) => e.preventDefault()}
                  {...register('confirmEmail')}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white/90">
                Teléfono
              </label>
              <div className="flex gap-2">
                <div className="w-36 flex-shrink-0">
                  <SelectField
                    value={selectedCountryCode}
                    onChange={handleCountryChange}
                    options={countryOptions}
                    placeholder="País"
                    error={errors.countryCode?.message}
                  />
                </div>
                <div className="flex-1">
                  <TextInput
                    id="phoneNumber"
                    placeholder="1234567890"
                    icon={Phone}
                    error={errors.phoneNumber?.message}
                    type="tel"
                    {...register('phoneNumber')}
                  />
                </div>
              </div>
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">
                {t('demographics.sectionTitle')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.48, duration: 0.4 }}
                >
                  <TextInput
                    id="dateOfBirth"
                    label={t('demographics.dateOfBirth')}
                    icon={Calendar}
                    error={errors.dateOfBirth?.message}
                    type="date"
                    max={maxDateOfBirth}
                    {...register('dateOfBirth')}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <SelectField
                    value={selectedGender || ''}
                    onChange={(value) => setValue('gender', value ? value as UserGender : null, { shouldValidate: true })}
                    options={genderOptions}
                    placeholder={t('demographics.gender.placeholder')}
                    label={t('demographics.gender.label')}
                    error={errors.gender?.message}
                  />
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white/90">
                  Contraseña
                </label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
              >
                <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white/90">
                  Confirmar
                </label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex items-start gap-2.5 pt-1"
            >
              <input
                type="checkbox"
                id="acceptTerms"
                {...register('acceptTerms')}
                className="sr-only"
              />
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
                      <motion.svg
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 w-full h-full text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span className="text-xs sm:text-sm text-[#0A2540] dark:text-white/80 leading-relaxed">
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setShowLegalModal(true)}
                    className="text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 font-medium transition-colors"
                  >
                    términos y condiciones
                  </button>
                  {' '}y la{' '}
                  <button
                    type="button"
                    onClick={() => setShowLegalModal(true)}
                    className="text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 font-medium transition-colors"
                  >
                    política de privacidad
                  </button>
                </span>
              </label>
            </motion.div>
            {errors.acceptTerms && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 dark:text-red-400 font-medium -mt-2"
              >
                {errors.acceptTerms.message}
              </motion.p>
            )}

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
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Crear cuenta</span>
                </>
              )}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-5"
          >
            <SocialLoginButtons showLoginLink={false} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            className="mt-5 text-center"
          >
            <p className="text-xs sm:text-sm text-[#6C757D] dark:text-white/60">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 transition-colors"
              >
                Inicia sesión aquí
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>

      {showLegalModal && (
        <LegalDocumentsModal isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} />
      )}

      <ToastNotification
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
        type="error"
        duration={6000}
      />
    </>
  );
}
