import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import './styles/globals/index.css'
import { AgentTrapLink } from './AgentTrapLink'
import { RootHead } from './RootHead'
import { RootProviders } from './RootProviders'
import { inter, montserrat } from './root-fonts'

export const metadata: Metadata = {
  title: 'SofLIA',
  description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA. Capacitacion, comunidad y adopcion de IA en el entorno laboral.',
  keywords: ['educacion', 'inteligencia artificial', 'chatbot', 'capacitacion', 'IA', 'LIA'],
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <RootHead />
      </head>
      <body
        className={`${inter.className} antialiased bg-[var(--color-bg-dark)] text-[var(--color-contrast)] transition-colors duration-300`}
        suppressHydrationWarning
      >
        <AgentTrapLink />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
