export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID;

export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_OAUTH_CLIENT_SECRET;

export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_OAUTH_CLIENT_ID;

export const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET;

export const REDIRECT_URI = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/study-planner/calendar/callback';
