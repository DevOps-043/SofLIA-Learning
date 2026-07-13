/**
 * Clases Tailwind compartidas por los formularios del Panel Maestro.
 * Mismas convenciones visuales que el resto del panel admin (dark/light).
 */

export const FIELD_LABEL_CLASS =
  'block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide'

export const FIELD_INPUT_CLASS =
  'w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200'

export const FIELD_INPUT_WITH_ICON_CLASS =
  'w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200'

export const FIELD_ICON_CLASS =
  'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors'

export const SECTION_TITLE_CLASS =
  'mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400'

export const LIST_ROW_CLASS =
  'flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/5'

export const EMPTY_STATE_CLASS =
  'rounded-xl border-2 border-dashed border-gray-200 py-6 text-center dark:border-white/10'

export const PRIMARY_BUTTON_CLASS =
  'flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white transition-all hover:bg-accent/90 disabled:opacity-50'

export const ASSIGN_BUTTON_CLASS =
  'flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50'

export const REMOVE_ICON_BUTTON_CLASS =
  'rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50'
