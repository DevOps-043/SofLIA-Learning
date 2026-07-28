'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthTabProvider, useAuthTab } from './AuthTabContext';
import { LoginForm } from '../LoginForm';
import { AuthTab } from '../../types/auth.types';

const RegisterForm = dynamic(
  () => import('../RegisterForm').then(mod => ({ default: mod.RegisterForm })),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[32rem] place-items-center" aria-label="Cargando registro">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    ),
  }
);

function AuthTabsContent() {
  const { activeTab } = useAuthTab();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
      </motion.div>
    </AnimatePresence>
  );
}

function AuthTabsWithProvider() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const initialTab: AuthTab = tabParam === 'register' ? 'register' : 'login';

  return (
    <AuthTabProvider initialTab={initialTab}>
      <AuthTabsContent />
    </AuthTabProvider>
  );
}

export function AuthTabs() {
  return (
    <Suspense fallback={
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 dark:border-accent/30 border-t-primary dark:border-t-accent rounded-full animate-spin"></div>
      </div>
    }>
      <AuthTabsWithProvider />
    </Suspense>
  );
}
