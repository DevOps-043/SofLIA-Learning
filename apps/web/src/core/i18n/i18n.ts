'use client';

import i18n from 'i18next';
import type { ResourceKey } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Spanish is bundled statically — it is the default language and must be available
// immediately with zero loading delay. EN and PT are lazy-loaded as separate webpack
// chunks (see loadLanguageAsync) so they never inflate the initial bundle.
import commonEs from '../../../public/locales/es/common.json';
import dashboardEs from '../../../public/locales/es/dashboard.json';
import contentEs from '../../../public/locales/es/content.json';
import learnEs from '../../../public/locales/es/learn.json';
import myCoursesEs from '../../../public/locales/es/my-courses.json';
import statisticsResultsEs from '../../../public/locales/es/statistics-results.json';
import communitiesEs from '../../../public/locales/es/communities.json';
import newsEs from '../../../public/locales/es/news.json';
import businessEs from '../../../public/locales/es/business.json';
import instructorEs from '../../../public/locales/es/instructor.json';
import adminEs from '../../../public/locales/es/admin.json';
import toursEs from '../../../public/locales/es/tours.json';
import legalEs from '../../../public/locales/es/legal.json';
import notebookEs from '../../../public/locales/es/notebook.json';

export type SupportedLanguage = 'es' | 'en' | 'pt';

export const ALL_NAMESPACES = [
  'common', 'dashboard', 'content', 'learn', 'my-courses',
  'statistics-results', 'communities', 'news', 'business', 'instructor', 'admin', 'tours', 'legal', 'notebook',
] as const;

type Namespace = (typeof ALL_NAMESPACES)[number];

const esResources: Record<Namespace, ResourceKey> = {
  common: commonEs,
  dashboard: dashboardEs,
  content: contentEs,
  learn: learnEs,
  'my-courses': myCoursesEs,
  'statistics-results': statisticsResultsEs,
  communities: communitiesEs,
  news: newsEs,
  business: businessEs,
  instructor: instructorEs,
  admin: adminEs,
  tours: toursEs,
  legal: legalEs,
  notebook: notebookEs,
};

let initialized = false;
const loadedLanguages = new Set<SupportedLanguage>(['es']);

export const initI18n = () => {
  if (!initialized && !i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: { es: esResources },
      lng: 'es',
      fallbackLng: 'es',
      ns: [...ALL_NAMESPACES],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    initialized = true;
  }
  return i18n;
};

// Lazy-loads EN or PT translation chunks. Each language becomes a separate webpack
// chunk that the browser fetches and caches independently — it is never part of the
// initial bundle. Falls back silently to Spanish (fallbackLng) while loading.
export const loadLanguageAsync = async (lang: SupportedLanguage): Promise<void> => {
  if (loadedLanguages.has(lang)) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let modules: Array<{ default: any }>;

  if (lang === 'en') {
    modules = await Promise.all([
      import('../../../public/locales/en/common.json'),
      import('../../../public/locales/en/dashboard.json'),
      import('../../../public/locales/en/content.json'),
      import('../../../public/locales/en/learn.json'),
      import('../../../public/locales/en/my-courses.json'),
      import('../../../public/locales/en/statistics-results.json'),
      import('../../../public/locales/en/communities.json'),
      import('../../../public/locales/en/news.json'),
      import('../../../public/locales/en/business.json'),
      import('../../../public/locales/en/instructor.json'),
      import('../../../public/locales/en/admin.json'),
      import('../../../public/locales/en/tours.json'),
      import('../../../public/locales/en/legal.json'),
      import('../../../public/locales/en/notebook.json'),
    ]);
  } else if (lang === 'pt') {
    modules = await Promise.all([
      import('../../../public/locales/pt/common.json'),
      import('../../../public/locales/pt/dashboard.json'),
      import('../../../public/locales/pt/content.json'),
      import('../../../public/locales/pt/learn.json'),
      import('../../../public/locales/pt/my-courses.json'),
      import('../../../public/locales/pt/statistics-results.json'),
      import('../../../public/locales/pt/communities.json'),
      import('../../../public/locales/pt/news.json'),
      import('../../../public/locales/pt/business.json'),
      import('../../../public/locales/pt/instructor.json'),
      import('../../../public/locales/pt/admin.json'),
      import('../../../public/locales/pt/tours.json'),
      import('../../../public/locales/pt/legal.json'),
      import('../../../public/locales/pt/notebook.json'),
    ]);
  } else {
    return;
  }

  // ALL_NAMESPACES order matches the Promise.all order above
  ALL_NAMESPACES.forEach((ns, idx) => {
    i18n.addResourceBundle(lang, ns, modules[idx].default, true, true);
  });

  loadedLanguages.add(lang);
};

// Kept for backward compatibility — consumers that call this defensively (e.g. tour.i18n.ts)
// no longer need it because Spanish is always available after initI18n().
// EN/PT are registered through loadLanguageAsync when the user selects those languages.
export const syncI18nResources = () => {};
