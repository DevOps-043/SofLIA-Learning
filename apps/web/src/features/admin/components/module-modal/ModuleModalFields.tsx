import { motion } from 'framer-motion';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { ModuleToggleCard } from './ModuleToggleCard';
import type { ModuleFormData } from './types';

interface ModuleModalFieldsProps {
  formData: ModuleFormData;
  setFormData: Dispatch<SetStateAction<ModuleFormData>>;
  t: TFunction<'admin'>;
}

export function ModuleModalFields({ formData, setFormData, t }: ModuleModalFieldsProps) {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="group">
        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-2 uppercase tracking-wide">{t('workshops.editor.modules.moduleTitleLabel')}</label>
        <div className="relative">
          <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] group-focus-within:text-[#00D4B3] transition-colors pointer-events-none" />
          <input
            type="text"
            required
            value={formData.module_title}
            onChange={(event) => setFormData((current) => ({ ...current, module_title: event.target.value }))}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-[#00D4B3]/50 transition-all duration-200"
            placeholder={t('workshops.editor.modules.moduleTitlePlaceholder')}
          />
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-2 uppercase tracking-wide">{t('workshops.editor.modules.moduleDescriptionLabel')}</label>
        <textarea
          rows={4}
          value={formData.module_description}
          onChange={(event) => setFormData((current) => ({ ...current, module_description: event.target.value }))}
          className="w-full px-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-[#00D4B3]/50 transition-all duration-200 resize-none"
          placeholder={t('workshops.editor.modules.moduleDescriptionPlaceholder')}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ModuleToggleCard checked={formData.is_required} onChange={(checked) => setFormData((current) => ({ ...current, is_required: checked }))} label={t('workshops.editor.modules.requiredLabel')} description={t('workshops.editor.modules.requiredDesc')} />
        <ModuleToggleCard checked={formData.is_published} onChange={(checked) => setFormData((current) => ({ ...current, is_published: checked }))} label={t('workshops.editor.modules.publishedLabel')} description={t('workshops.editor.modules.publishedDesc')} />
      </motion.div>
    </>
  );
}
