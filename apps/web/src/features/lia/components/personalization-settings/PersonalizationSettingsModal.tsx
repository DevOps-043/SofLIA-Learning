'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification';
import { FooterActions } from './FooterActions';
import { ModalHeader } from './ModalHeader';
import { ResetConfirmation } from './ResetConfirmation';
import { SettingsSections } from './SettingsSections';
import type { PersonalizationSettingsModalProps } from './types';
import { usePersonalizationSettingsForm } from './usePersonalizationSettingsForm';
import styles from './PersonalizationSettings.module.css';

export function PersonalizationSettingsModal(props: PersonalizationSettingsModalProps) {
  const form = usePersonalizationSettingsForm({
    controller: props.controller,
    isOpen: props.isOpen,
  });

  if (!props.isOpen) {
    return null;
  }

  return (
    <>
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={props.onClose}
        aria-label="Cerrar personalización"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.985, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 12 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="soflia-personalization-title"
      >
        <ModalHeader onClose={props.onClose} title={props.title} />
        <div className={styles.body}>
          {props.controller.loading && !props.controller.settings ? (
            <div className={styles.loading}>
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : props.controller.error ? (
            <div className={styles.error}>
              {props.controller.error}
            </div>
          ) : (
            <SettingsSections
              expandedSections={form.expandedSections}
              formData={form.formData}
              setFormData={form.setFormData}
              toggleSection={form.toggleSection}
            />
          )}
        </div>
        <ResetConfirmation
          show={form.showResetConfirm}
          onCancel={() => form.setShowResetConfirm(false)}
          onConfirm={form.handleResetConfirm}
        />
        <FooterActions
          isSaving={form.isSaving}
          onClose={props.onClose}
          onReset={() => form.setShowResetConfirm(true)}
          onSave={form.handleSave}
        />
      </motion.div>
    </div>
    <ToastNotification
      isOpen={form.toast.isOpen}
      onClose={form.hideToast}
      message={form.toast.message}
      type={form.toast.type}
      position="top-right"
    />
    </>
  );
}
