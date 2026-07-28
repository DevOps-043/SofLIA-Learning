'use client';

import { Suspense } from 'react';
import { AuthExperience } from '../../features/auth/components/AuthExperience';
import { AuthTabs } from '../../features/auth/components/AuthTabs';
import styles from './AuthPage.module.css';

function AuthFormFallback() {
  return (
    <div className={styles.formFallback} aria-label="Cargando acceso">
      <span />
      <span />
      <span />
    </div>
  );
}

export default function AuthPage() {
  return (
    <AuthExperience panelClassName={styles.formColumn}>
      <Suspense fallback={<AuthFormFallback />}>
        <AuthTabs />
      </Suspense>
    </AuthExperience>
  );
}
