'use client';

import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEs from '../../../public/locales/es/common.json';
import commonEn from '../../../public/locales/en/common.json';
import commonPt from '../../../public/locales/pt/common.json';
import dashboardEs from '../../../public/locales/es/dashboard.json';
import dashboardEn from '../../../public/locales/en/dashboard.json';
import dashboardPt from '../../../public/locales/pt/dashboard.json';
import contentEs from '../../../public/locales/es/content.json';
import contentEn from '../../../public/locales/en/content.json';
import contentPt from '../../../public/locales/pt/content.json';
import learnEs from '../../../public/locales/es/learn.json';
import learnEn from '../../../public/locales/en/learn.json';
import learnPt from '../../../public/locales/pt/learn.json';
import myCoursesEs from '../../../public/locales/es/my-courses.json';
import myCoursesEn from '../../../public/locales/en/my-courses.json';
import myCoursesPt from '../../../public/locales/pt/my-courses.json';
import statisticsResultsEs from '../../../public/locales/es/statistics-results.json';
import statisticsResultsEn from '../../../public/locales/en/statistics-results.json';
import statisticsResultsPt from '../../../public/locales/pt/statistics-results.json';
import communitiesEs from '../../../public/locales/es/communities.json';
import communitiesEn from '../../../public/locales/en/communities.json';
import communitiesPt from '../../../public/locales/pt/communities.json';
import newsEs from '../../../public/locales/es/news.json';
import newsEn from '../../../public/locales/en/news.json';
import newsPt from '../../../public/locales/pt/news.json';
import businessEs from '../../../public/locales/es/business.json';
import businessEn from '../../../public/locales/en/business.json';
import businessPt from '../../../public/locales/pt/business.json';
import instructorEs from '../../../public/locales/es/instructor.json';
import instructorEn from '../../../public/locales/en/instructor.json';
import instructorPt from '../../../public/locales/pt/instructor.json';
import adminEs from '../../../public/locales/es/admin.json';
import adminEn from '../../../public/locales/en/admin.json';
import adminPt from '../../../public/locales/pt/admin.json';

export type SupportedLanguage = 'es' | 'en' | 'pt';

const resources: Resource = {
  es: {
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
  },
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    content: contentEn,
    learn: learnEn,
    'my-courses': myCoursesEn,
    'statistics-results': statisticsResultsEn,
    communities: communitiesEn,
    news: newsEn,
    business: businessEn,
    instructor: instructorEn,
    admin: adminEn,
  },
  pt: {
    common: commonPt,
    dashboard: dashboardPt,
    content: contentPt,
    learn: learnPt,
    'my-courses': myCoursesPt,
    'statistics-results': statisticsResultsPt,
    communities: communitiesPt,
    news: newsPt,
    business: businessPt,
    instructor: instructorPt,
    admin: adminPt,
  },
};

let initialized = false;

export const initI18n = () => {
  if (!initialized && !i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: 'es',
      fallbackLng: 'es',
      ns: ['common', 'dashboard', 'content', 'learn', 'my-courses', 'statistics-results', 'communities', 'news', 'business', 'instructor', 'admin'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    initialized = true;
  } else {
    // Ensure business namespace is loaded even if i18n was already initialized (HMR/Singleton fix)
    (['es', 'en', 'pt'] as SupportedLanguage[]).forEach(lang => {
      // Always add/update resource bundles to ensure latest content (HMR/Singleton fix)
      i18n.addResourceBundle(lang, 'common', resources[lang].common, true, true);
      i18n.addResourceBundle(lang, 'learn', resources[lang].learn, true, true);
      i18n.addResourceBundle(lang, 'business', resources[lang].business, true, true);
      i18n.addResourceBundle(lang, 'instructor', resources[lang].instructor, true, true);
      i18n.addResourceBundle(lang, 'admin', resources[lang].admin, true, true);
    });
  }

  return i18n;
};

// Force re-compile to pick up new JSON translations (LIA update)
