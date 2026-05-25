import { Check, Search } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseSearchProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseSearch({ modal, t, theme }: BusinessAssignCourseSearchProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:opacity-100 transition-opacity" style={{ color: theme.textColor }} />
        <input
          className="w-full pl-12 pr-6 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
          placeholder={t('assignCourse.search.users', 'Buscar usuarios...')}
          value={modal.searchTerm}
          onChange={(event) => modal.setSearchTerm(event.target.value)}
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
        />
      </div>
      {modal.availableUserCount > 0 && (
        <button
          type="button"
          onClick={modal.handleSelectAllUsers}
          className="lg:col-span-4 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest"
          style={{
            backgroundColor: modal.allUsersSelected ? `color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent)` : theme.inputBg,
            borderColor: modal.allUsersSelected ? theme.primaryColor : theme.borderColor,
            color: theme.textColor,
          }}
        >
          <div className="w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all" style={{ backgroundColor: modal.allUsersSelected ? theme.primaryColor : 'transparent', borderColor: modal.allUsersSelected ? theme.primaryColor : theme.borderColor }}>
            {modal.allUsersSelected ? <Check className="w-3.5 h-3.5" style={{ color: theme.onPrimaryColor }} strokeWidth={3} /> : null}
          </div>
          <span>{t('assignCourse.selectAll', 'Seleccionar Todos')}</span>
        </button>
      )}
    </div>
  );
}
