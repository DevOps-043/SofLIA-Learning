'use client';

import type { FormEvent } from 'react';
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import type { TFunction } from 'i18next';

interface MfaChallengeFormProps {
  code: string;
  isPending: boolean;
  onBack: () => void;
  onCodeChange: (code: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: TFunction;
}

export function MfaChallengeForm({
  code,
  isPending,
  onBack,
  onCodeChange,
  onSubmit,
  t,
}: MfaChallengeFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('auth.login.mfa.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
            {t('auth.login.mfa.subtitle')}
          </p>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('auth.login.mfa.codeLabel')}
        </span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="one-time-code"
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-center font-mono text-lg text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-white/10"
            disabled={isPending}
            inputMode="numeric"
            maxLength={64}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder={t('auth.login.mfa.codePlaceholder')}
            value={code}
          />
        </div>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
          disabled={isPending}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth.login.mfa.back')}
        </button>
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          disabled={isPending || !code.trim()}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {isPending ? t('auth.login.mfa.verifying') : t('auth.login.mfa.verify')}
        </button>
      </div>
    </form>
  );
}
