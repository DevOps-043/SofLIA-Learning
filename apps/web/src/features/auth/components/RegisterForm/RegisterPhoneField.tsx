import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { SelectField, type SelectOption } from '../../../../core/components/SelectField/SelectField';
import type { RegisterFormData } from '../../types/auth.types';
import { TextInput } from '../TextInput';

type Translate = (key: string) => string;

interface RegisterPhoneFieldProps {
  t: Translate;
  errors: FieldErrors<RegisterFormData>;
  register: UseFormRegister<RegisterFormData>;
  selectedCountryCode: string;
  countryOptions: SelectOption[];
  onCountryChange: (countryCode: string | number) => void;
}

export function RegisterPhoneField({
  t,
  errors,
  register,
  selectedCountryCode,
  countryOptions,
  onCountryChange,
}: RegisterPhoneFieldProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
      <label className="block text-sm font-medium mb-2 text-primary dark:text-white/90">
        {t('auth.register.phoneLabel')}
      </label>
      <div className="flex gap-2">
        <div className="w-36 flex-shrink-0">
          <SelectField
            value={selectedCountryCode}
            onChange={onCountryChange}
            options={countryOptions}
            placeholder={t('auth.register.countryPlaceholder')}
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
  );
}
