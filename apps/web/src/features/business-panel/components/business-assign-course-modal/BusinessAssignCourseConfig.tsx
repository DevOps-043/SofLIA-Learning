import { motion } from 'framer-motion';
import { Calendar, Sparkles, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import { getDateInputValue, toEndOfDayIso } from './date-utils';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseConfigProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseConfig({ modal, t, theme }: BusinessAssignCourseConfigProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedTextColor }}>Configuración de Asignación</label>
        <div className="relative group">
          <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" style={{ color: theme.textColor }} />
          <input
            type="date"
            value={getDateInputValue(modal.dueDate)}
            onChange={(event) => {
              if (!event.target.value) { modal.setDueDate(''); modal.setSuggestionReason(null); return; }
              modal.setDueDate(toEndOfDayIso(event.target.value));
              modal.setSuggestionReason(null);
            }}
            min={new Date().toISOString().split('T')[0]}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          />
          {modal.dueDate && (
            <button onClick={() => { modal.setDueDate(''); modal.setSuggestionReason(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all" style={{ color: theme.mutedTextColor }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-6 flex flex-col justify-end">
        <div className="flex items-center gap-3">
          <motion.button type="button" onClick={modal.handleSuggestLiaDate} disabled={modal.isSuggesting} className="px-6 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm" style={{ backgroundColor: `color-mix(in srgb, ${theme.accentColor} 6.3%, transparent)`, borderColor: `color-mix(in srgb, ${theme.accentColor} 14.5%, transparent)`, color: theme.accentColor }} whileHover={{ scale: 1.02, backgroundColor: `color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)`, borderColor: `color-mix(in srgb, ${theme.accentColor} 25.1%, transparent)` }} whileTap={{ scale: 0.98 }}>
            {modal.isSuggesting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
            <span>{t('assignCourse.buttons.suggestLia', 'Sugerir con SofLIA')}</span>
          </motion.button>
          {modal.suggestionReason && <div className="flex-1 text-[10px] font-bold italic opacity-40 px-2 leading-tight">SofLIA: {modal.suggestionReason}</div>}
        </div>
      </div>
    </div>
  );
}
