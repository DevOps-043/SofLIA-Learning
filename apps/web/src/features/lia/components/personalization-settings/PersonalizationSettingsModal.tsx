'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { FooterActions } from './FooterActions';
import { ModalHeader } from './ModalHeader';
import { ResetConfirmation } from './ResetConfirmation';
import { SaveMessage } from './SaveMessage';
import { SettingsSections } from './SettingsSections';
import type { PersonalizationSettingsModalProps } from './types';
import { usePersonalizationSettingsForm } from './usePersonalizationSettingsForm';

export function PersonalizationSettingsModal(props: PersonalizationSettingsModalProps) {
  const form = usePersonalizationSettingsForm({
    controller: props.controller,
    isOpen: props.isOpen,
  });

  if (!props.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={props.onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(event) => event.stopPropagation()}
        className="relative bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <ModalHeader onClose={props.onClose} title={props.title} />
        <div className="flex-1 overflow-y-auto p-6">
          {props.controller.loading && !props.controller.settings ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : props.controller.error ? (
            <div className="text-center py-20 text-red-500">
              {props.controller.error}
            </div>
          ) : (
            <div className="space-y-4">
              <SaveMessage message={form.saveMessage} />
              <SettingsSections
                expandedSections={form.expandedSections}
                formData={form.formData}
                setFormData={form.setFormData}
                toggleSection={form.toggleSection}
              />
            </div>
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
  );
}
