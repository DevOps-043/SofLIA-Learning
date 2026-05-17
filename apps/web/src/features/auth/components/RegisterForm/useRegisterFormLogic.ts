import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { RegisterFormData } from '../../types/auth.types';
import { registerAction } from '../../actions/register';
import { useAuthTab } from '../AuthTabs/AuthTabContext';
import { getRegisterSchema } from './RegisterForm.schema';
import {
  buildCountryOptions,
  buildGenderOptions,
  resolveCountryDialing,
} from './register-form-options';
import { toRegisterActionFormData } from './register-form-submit';

const REGISTER_DEFAULT_VALUES: RegisterFormData = {
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
};

export function useRegisterFormLogic() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { setActiveTab } = useAuthTab();
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('MX');
  const [dialCode, setDialCode] = useState('+52');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const registerSchema = React.useMemo(() => getRegisterSchema(t), [t]);
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: REGISTER_DEFAULT_VALUES,
  });

  const handleCountryChange = (countryCode: string | number) => {
    const country = resolveCountryDialing(countryCode);
    if (!country) return;
    setSelectedCountryCode(country.code);
    setDialCode(country.dialCode);
    form.setValue('countryCode', country.code);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await registerAction(toRegisterActionFormData(data));
        if (result?.error) setError(result.error);
        else if (result?.success) setSuccess(result.message || t('auth.register.success'));
      } catch {
        setError(t('auth.register.error'));
      }
    });
  };

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.push('/auth?tab=login'), 2000);
    return () => clearTimeout(timer);
  }, [router, success]);

  return {
    t,
    form,
    showLegalModal,
    setShowLegalModal,
    selectedCountryCode,
    dialCode,
    isPending,
    error,
    setError,
    success,
    setActiveTab,
    countryOptions: buildCountryOptions(),
    genderOptions: buildGenderOptions(t),
    acceptTerms: form.watch('acceptTerms'),
    selectedGender: form.watch('gender'),
    maxDateOfBirth: new Date().toISOString().slice(0, 10),
    handleCountryChange,
    onSubmit,
  };
}
