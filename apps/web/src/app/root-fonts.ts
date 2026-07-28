import {
  IBM_Plex_Sans,
  Inter_Tight,
  Newsreader,
} from 'next/font/google'

// Display headlines across public pages and application panels.
export const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  weight: ['300', '400'],
  style: ['normal', 'italic'],
})

// Body copy, navigation, controls and buttons.
export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['400', '500', '600', '700'],
})

// Labels, tables, data and numeric details.
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  weight: ['400', '500', '600'],
})
