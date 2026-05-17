import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { SelectField, type SelectOption } from '../../../../core/components/SelectField/SelectField';
import type { RegisterFormData } from '../../types/auth.types';
import type { UserGender } from '../../../../lib/schemas/user-demographics.schema';
import { TextInput } from '../TextInput';

type Translate = (key: string) => string;

interface RegisterDemographicsFieldsProps {
  t: Translate;
  errors: FieldErrors<RegisterFormData>;
  register: UseFormRegister<RegisterFormData>;
  setValue: UseFormSetValue<RegisterFormData>;
  selectedGender: UserGender | null;
  genderOptions: SelectOption[];
  maxDateOfBirth: string;
}

export function RegisterDemographicsFields({
  t,
  errors,
  register,
  setValue,
  selectedGender,
  genderOptions,
  maxDateOfBirth,
}: RegisterDemographicsFieldsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">{t('demographics.sectionTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48, duration: 0.4 }}>
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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
          <SelectField
            value={selectedGender || ''}
            onChange={(value) => setValue('gender', value ? (value as UserGender) : null, { shouldValidate: true })}
            options={genderOptions}
            placeholder={t('demographics.gender.placeholder')}
            label={t('demographics.gender.label')}
            error={errors.gender?.message}
          />
        </motion.div>
      </div>
    </div>
  );
}
