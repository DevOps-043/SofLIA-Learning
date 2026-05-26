'use client';

import { useState } from 'react';
import { logger as techDebtLogger } from '@/lib/utils/logger';

export interface LandingContactFormData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  companySize?: string;
  interest?: string;
  message?: string;
}

interface SubmitContactParams {
  data: LandingContactFormData;
  source: string;
}

const EMPTY_FORM: LandingContactFormData = {
  name: '',
  email: '',
  company: '',
  phone: '',
  companySize: '',
  interest: '',
  message: '',
};

export function useLandingContactForm(initialData: Partial<LandingContactFormData> = {}) {
  const [formData, setFormData] = useState<LandingContactFormData>({
    ...EMPTY_FORM,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: keyof LandingContactFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (submitError) {
      setSubmitError(null);
    }
  };

  const submitContact = async ({ data, source }: SubmitContactParams) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/landing/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Contact form failed with status ${response.status}`);
      }

      setIsSubmitted(true);
      setFormData(EMPTY_FORM);
    } catch (error) {
      techDebtLogger.error('Error submitting landing contact form:', error);
      setSubmitError('landing.cta.error.description');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isSubmitted,
    submitError,
    updateField,
    submitContact,
  };
}
