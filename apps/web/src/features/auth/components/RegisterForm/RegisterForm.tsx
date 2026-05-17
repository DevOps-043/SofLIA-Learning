'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ToastNotification } from '../../../../core/components/ToastNotification';
import { RegisterAccountFields } from './RegisterAccountFields';
import { RegisterDemographicsFields } from './RegisterDemographicsFields';
import { RegisterFooter } from './RegisterFooter';
import { RegisterFormHeader } from './RegisterFormHeader';
import { RegisterNameFields } from './RegisterNameFields';
import { RegisterPasswordFields } from './RegisterPasswordFields';
import { RegisterPhoneField } from './RegisterPhoneField';
import { RegisterStatusMessage } from './RegisterStatusMessage';
import { RegisterSubmitButton } from './RegisterSubmitButton';
import { RegisterTermsField } from './RegisterTermsField';
import { useRegisterFormLogic } from './useRegisterFormLogic';

const LegalDocumentsModal = dynamic(
  () => import('../LegalDocumentsModal').then((mod) => ({ default: mod.LegalDocumentsModal })),
  { ssr: false }
);

export function RegisterForm() {
  const logic = useRegisterFormLogic();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = logic.form;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full">
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-xl dark:shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 sm:p-6 lg:p-8">
          <RegisterFormHeader t={logic.t} />
          <RegisterStatusMessage success={logic.success} />
          <form onSubmit={handleSubmit(logic.onSubmit)} className="space-y-3">
            <RegisterNameFields t={logic.t} errors={errors} register={register} />
            <RegisterAccountFields t={logic.t} errors={errors} register={register} />
            <RegisterPhoneField
              t={logic.t}
              errors={errors}
              register={register}
              selectedCountryCode={logic.selectedCountryCode}
              countryOptions={logic.countryOptions}
              onCountryChange={logic.handleCountryChange}
            />
            <RegisterDemographicsFields
              t={logic.t}
              errors={errors}
              register={register}
              setValue={setValue}
              selectedGender={logic.selectedGender}
              genderOptions={logic.genderOptions}
              maxDateOfBirth={logic.maxDateOfBirth}
            />
            <RegisterPasswordFields t={logic.t} errors={errors} register={register} />
            <RegisterTermsField
              t={logic.t}
              acceptTerms={logic.acceptTerms}
              error={errors.acceptTerms}
              register={register}
              onOpenLegalModal={() => logic.setShowLegalModal(true)}
            />
            <RegisterSubmitButton t={logic.t} isPending={logic.isPending} />
          </form>
          <RegisterFooter t={logic.t} onLoginClick={() => logic.setActiveTab('login')} />
        </div>
      </motion.div>
      {logic.showLegalModal && (
        <LegalDocumentsModal isOpen={logic.showLegalModal} onClose={() => logic.setShowLegalModal(false)} />
      )}
      <ToastNotification
        isOpen={!!logic.error}
        onClose={() => logic.setError(null)}
        message={logic.error || ''}
        type="error"
        duration={6000}
      />
    </>
  );
}
