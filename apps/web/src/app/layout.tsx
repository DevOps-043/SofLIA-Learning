import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../core/components/ThemeProvider';

import { PrefetchManager } from '../core/components/PrefetchManager';
import { SWRProvider } from '../core/providers/SWRProvider';
import { NotificationProvider } from '../features/notifications/context/NotificationContext';
import { I18nProvider } from '../core/providers/I18nProvider';
import { ShareModalProvider } from '../core/providers/ShareModalProvider';
import { OnboardingAgent } from '../core/components/OnboardingAgent';
import { LiaPanelProvider } from '../core/contexts/LiaPanelContext';
import { TourRestartProvider } from '../core/contexts/TourRestartContext';
import { ContentWrapper } from '../core/components/ContentWrapper';
import { AuthSecurityGuard } from '../features/auth/components/AuthSecurityGuard';
import { OrganizationStylesProvider } from '../features/business-panel/contexts/OrganizationStylesContext';
import { OrganizationProvider } from '../core/providers/OrganizationProvider';
import { AutomationSignalsReporter } from '../components/security/AutomationSignalsReporter';
import {
  AGENT_POLICY_ENTRYPOINT,
  AGENT_POLICY_JSON,
  AGENT_POLICY_META_CONTENT,
  AGENT_POLICY_VERSION,
} from '../lib/security/agent-policy';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '700'], // Regular, Medium, Bold
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '700', '800'],
});

export const metadata: Metadata = {
  title: 'SofLIA',
  description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA. Capacitación, comunidad y adopción de IA en el entorno laboral.',
  keywords: ['educación', 'inteligencia artificial', 'chatbot', 'capacitación', 'IA', 'LIA'],
  authors: [{ name: 'Equipo SofLIA' }],
  robots: 'index, follow',
  icons: {
    icon: '/icono.ico',
    apple: '/icono.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SofLIA',
  },
  openGraph: {
    title: 'SofLIA',
    description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA',
    type: 'website',
    locale: 'es_ES',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        {/* ðŸ”§ Script para manejar errores de chunks (ChunkLoadError) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Manejar errores de carga de chunks
                window.addEventListener('error', function(e) {
                  if (e.message && (
                    e.message.includes('Loading chunk') ||
                    e.message.includes('ChunkLoadError') ||
                    e.message.includes('Failed to fetch dynamically imported module') ||
                    e.message.includes('Loading CSS chunk') ||
                    (e.target && e.target.tagName === 'SCRIPT' && e.target.src && e.target.src.includes('_next/static/chunks'))
                  )) {
                    console.warn('🔄 ChunkLoadError detectado, recargando página...', e.message);
                    // Evitar recargas infinitas
                    var reloadKey = 'chunk-reload-attempt';
                    var attempts = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
                    if (attempts < 2) {
                      sessionStorage.setItem(reloadKey, String(attempts + 1));
                      setTimeout(function() {
                        window.location.reload();
                      }, 100);
                    } else {
                      sessionStorage.removeItem(reloadKey);
                      console.error('âŒ Múltiples intentos de recarga fallidos. Por favor, recarga manualmente la página.');
                    }
                    e.preventDefault();
                    return true;
                  }
                }, true);
                
                // Manejar promesas rechazadas (para dynamic imports)
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && (
                    e.reason.message && (
                      e.reason.message.includes('Loading chunk') ||
                      e.reason.message.includes('ChunkLoadError') ||
                      e.reason.message.includes('Failed to fetch dynamically imported module')
                    ) ||
                    e.reason.name === 'ChunkLoadError'
                  )) {
                    console.warn('🔄 ChunkLoadError en promesa rechazada, recargando página...', e.reason);
                    var reloadKey = 'chunk-reload-attempt';
                    var attempts = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
                    if (attempts < 2) {
                      sessionStorage.setItem(reloadKey, String(attempts + 1));
                      setTimeout(function() {
                        window.location.reload();
                      }, 100);
                    } else {
                      sessionStorage.removeItem(reloadKey);
                      console.error('âŒ Múltiples intentos de recarga fallidos. Por favor, recarga manualmente la página.');
                    }
                    e.preventDefault();
                  }
                });
                
                // Limpiar contador de intentos después de 5 minutos
                setTimeout(function() {
                  sessionStorage.removeItem('chunk-reload-attempt');
                }, 5 * 60 * 1000);
              })();
            `,
          }}
        />

        {/*
          Pre-paint device detection.  We mark the html element with
          `is-apple-platform` when running on Safari (iOS, iPadOS, macOS
          Safari).  The CSS at globals.css uses this hook to hide
          GPU-heavy decorative blur orbs that overheat the device.
          Runs synchronously in <head> so the class is set before the
          first paint of <body>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var ua = navigator.userAgent || '';
                  var platform = navigator.platform || '';
                  var maxTouchPoints = navigator.maxTouchPoints || 0;
                  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
                  var isMacLike = /Macintosh|Mac OS X/i.test(ua) || platform.indexOf('Mac') === 0;
                  var isWebKit = ua.indexOf('AppleWebKit') !== -1 && ua.indexOf('Safari') !== -1 && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox/.test(ua);
                  if (isIOS || isMacLike || isWebKit) {
                    document.documentElement.classList.add('is-apple-platform');
                  }
                } catch (e) { /* swallow */ }
              })();
            `,
          }}
        />

        {/* ðŸŽ¨ Script para aplicar tema antes del render (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var themeStorage = localStorage.getItem('theme-storage');
                  var resolvedTheme = 'dark';
                  
                  if (themeStorage) {
                    try {
                      var parsed = JSON.parse(themeStorage);
                      // Zustand persist guarda como { state: { theme: '...' }, version: 0 }
                      var savedTheme = parsed.state?.theme || parsed.theme || 'system';
                      
                      if (savedTheme === 'system') {
                        // Detectar preferencia del sistema
                        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        resolvedTheme = prefersDark ? 'dark' : 'light';
                      } else if (savedTheme === 'dark' || savedTheme === 'light') {
                        resolvedTheme = savedTheme;
                      } else {
                        // Si el tema guardado no es válido, usar sistema
                        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        resolvedTheme = prefersDark ? 'dark' : 'light';
                      }
                    } catch (e) {
                      // Si hay error al parsear, usar preferencia del sistema
                      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                      resolvedTheme = prefersDark ? 'dark' : 'light';
                    }
                  } else {
                    // Si no hay tema guardado, usar preferencia del sistema por defecto
                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    resolvedTheme = prefersDark ? 'dark' : 'light';
                  }
                  
                  // Aplicar el tema al documento
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add(resolvedTheme);
                  root.style.colorScheme = resolvedTheme;
                } catch (e) {
                  // Fallback a dark si hay algún error
                  var root = document.documentElement;
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />

        {/* 🚀 Resource Hints - Mejora conexión a APIs externas 20-30% */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://odbxqmhbnkfledqcqujl.supabase.co" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://odbxqmhbnkfledqcqujl.supabase.co" />

        {/* 📱 PWA Meta Tags */}
        <meta name="application-name" content="SofLIA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SofLIA" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="x-soflia-agent-policy" content={AGENT_POLICY_META_CONTENT} />
        <meta name="x-soflia-agent-policy-version" content={AGENT_POLICY_VERSION} />
        <meta name="x-soflia-agent-policy-entrypoint" content={AGENT_POLICY_ENTRYPOINT} />
        <script
          id="soflia-agent-policy"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(AGENT_POLICY_JSON),
          }}
        />

        {/* ðŸŽ¨ Splash Screens iOS */}
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
      </head>
      <body className={`${inter.className} antialiased bg-[var(--color-bg-dark)] text-[var(--color-contrast)] transition-colors duration-300`} suppressHydrationWarning>
        <a
          href="/api/_agent-trap?source=layout"
          rel="nofollow noreferrer"
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
          data-agent-trap="true"
        >
          Internal diagnostics
        </a>
        <SWRProvider>
            <I18nProvider>
              <ThemeProvider>
                <ShareModalProvider>
                  <NotificationProvider pollingInterval={60000}>
                    <OrganizationProvider>
                      <OrganizationStylesProvider>
                        <TourRestartProvider>
                        <LiaPanelProvider>
                          <PrefetchManager />
                          <AutomationSignalsReporter />
                          <AuthSecurityGuard>
                            <ContentWrapper>
                              {children}
                            </ContentWrapper>
                          </AuthSecurityGuard>
                          {/* AI Chat Agent - Lia - Disponible en todas las páginas excepto lessons - Removed
                        <ConditionalAIChatAgent /> */}
                          {/* Onboarding Agent - Asistente estilo JARVIS para primera visita */}
                          <OnboardingAgent />


                        </LiaPanelProvider>
                        </TourRestartProvider>
                      </OrganizationStylesProvider>
                    </OrganizationProvider>
                  </NotificationProvider>
                </ShareModalProvider>
              </ThemeProvider>
            </I18nProvider>
          </SWRProvider>
      </body>
    </html>
  );
}
