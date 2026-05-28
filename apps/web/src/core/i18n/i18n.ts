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
import toursEs from '../../../public/locales/es/tours.json';
import toursEn from '../../../public/locales/en/tours.json';
import toursPt from '../../../public/locales/pt/tours.json';
import legalEs from '../../../public/locales/es/legal.json';
import legalEn from '../../../public/locales/en/legal.json';
import legalPt from '../../../public/locales/pt/legal.json';

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
    tours: toursEs,
    legal: legalEs,
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
    tours: toursEn,
    legal: legalEn,
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
    tours: toursPt,
    legal: legalPt,
  },
};

const ALL_NAMESPACES = [
  'common', 'dashboard', 'content', 'learn', 'my-courses',
  'statistics-results', 'communities', 'news', 'business', 'instructor', 'admin', 'tours', 'legal',
] as const;

/** Ensures all resource bundles are present in the singleton, idempotent. */
function syncResourceBundles() {
  (['es', 'en', 'pt'] as SupportedLanguage[]).forEach(lang => {
    ALL_NAMESPACES.forEach(ns => {
      const bundle = (resources[lang] as Record<string, unknown>)[ns];
      if (bundle) {
        i18n.addResourceBundle(lang, ns, bundle, true, true);
      }
    });
  });
}

let initialized = false;

export const syncI18nResources = () => {
  syncResourceBundles();
};

export const initI18n = () => {
  if (!initialized && !i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: 'es',
      fallbackLng: 'es',
      ns: [...ALL_NAMESPACES],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    syncResourceBundles();
    initialized = true;
  } else {
    // HMR / StrictMode double-invoke fix: always re-sync ALL namespaces
    syncResourceBundles();
  }

  return i18n;
};

// Force re-compile to pick up new JSON translations (voice reading feature)
