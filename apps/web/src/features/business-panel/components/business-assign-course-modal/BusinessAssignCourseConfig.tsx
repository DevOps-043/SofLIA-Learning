import { Sparkles } from 'lucide-react';
import type { TFunction } from 'i18next';
import { PremiumDateTimePicker } from '@/shared/components/premium-form-controls';
import modalStyles from '../ContentModal.module.css';
import { getDateInputValue, toEndOfDayIso } from './date-utils';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseConfigProps {
  modal: BusinessAssignCourseModalState;
  t: TFunction<'business'>;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseConfig({ modal, t, theme }: BusinessAssignCourseConfigProps) {
  const palette = {
    accentColor: theme.accentColor,
    borderColor: theme.borderColor,
    inputBg: theme.inputBg,
    menuBg: theme.cardBg,
    mutedText: theme.subtextColor,
    onPrimaryColor: theme.onActionColor,
    primaryColor: theme.actionColor,
    surfaceColor: theme.panelBg,
    textColor: theme.textColor,
  };

  return (
    <div className={modalStyles.configuration}>
      <span className={modalStyles.configurationLabel}>Configuración de asignación</span>
      <div className={modalStyles.field}>
        <span className={modalStyles.fieldLabel}>Fecha objetivo</span>
        <PremiumDateTimePicker
          ariaLabel="Fecha objetivo del curso"
          min={new Date().toISOString().split('T')[0]}
          mode="date"
          onChange={(value) => {
            modal.setDueDate(value ? toEndOfDayIso(value) : '');
            modal.setSuggestionReason(null);
          }}
          palette={palette}
          placeholder="Seleccionar fecha"
          value={getDateInputValue(modal.dueDate)}
        />
      </div>
      <div className={modalStyles.configurationActions}>
        <button
          className={modalStyles.secondaryButton}
          disabled={modal.isSuggesting}
          onClick={modal.handleSuggestLiaDate}
          type="button"
        >
          {modal.isSuggesting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          <span>{t('assignCourse.buttons.suggestLia', 'Sugerir con SofLIA')}</span>
        </button>
      </div>
      {modal.suggestionReason ? (
        <p className={modalStyles.notice}>SofLIA: {modal.suggestionReason}</p>
      ) : null}
    </div>
  );
}
