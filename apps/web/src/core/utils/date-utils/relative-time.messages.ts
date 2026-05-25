import type { DateLocale } from './date-utils.types'

interface RelativeTimeMessages {
  now: string
  minute: string
  minutes: string
  hour: string
  hours: string
  day: string
  days: string
  week: string
  weeks: string
  month: string
  months: string
  year: string
  years: string
  fallback: string
  future: string
}

export const relativeTimeMessages: Record<DateLocale, RelativeTimeMessages> = {
  es: {
    now: 'Hace unos segundos',
    minute: 'Hace {{count}} minuto',
    minutes: 'Hace {{count}} minutos',
    hour: 'Hace {{count}} hora',
    hours: 'Hace {{count}} horas',
    day: 'Hace {{count}} día',
    days: 'Hace {{count}} días',
    week: 'Hace {{count}} semana',
    weeks: 'Hace {{count}} semanas',
    month: 'Hace {{count}} mes',
    months: 'Hace {{count}} meses',
    year: 'Hace {{count}} año',
    years: 'Hace {{count}} años',
    fallback: 'Hace algún tiempo',
    future: 'Ahora',
  },
  en: {
    now: 'Just now',
    minute: '{{count}} minute ago',
    minutes: '{{count}} minutes ago',
    hour: '{{count}} hour ago',
    hours: '{{count}} hours ago',
    day: '{{count}} day ago',
    days: '{{count}} days ago',
    week: '{{count}} week ago',
    weeks: '{{count}} weeks ago',
    month: '{{count}} month ago',
    months: '{{count}} months ago',
    year: '{{count}} year ago',
    years: '{{count}} years ago',
    fallback: 'Some time ago',
    future: 'Just now',
  },
  pt: {
    now: 'Agora mesmo',
    minute: 'Há {{count}} minuto',
    minutes: 'Há {{count}} minutos',
    hour: 'Há {{count}} hora',
    hours: 'Há {{count}} horas',
    day: 'Há {{count}} dia',
    days: 'Há {{count}} dias',
    week: 'Há {{count}} semana',
    weeks: 'Há {{count}} semanas',
    month: 'Há {{count}} mês',
    months: 'Há {{count}} meses',
    year: 'Há {{count}} ano',
    years: 'Há {{count}} anos',
    fallback: 'Há algum tempo',
    future: 'Agora',
  },
}
