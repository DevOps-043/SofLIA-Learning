'use client'

import { useEffect } from 'react'

interface NavigatorWithUAData extends Navigator {
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>
  }
}

function collectAutomationSignals() {
  const userAgent = navigator.userAgent || ''
  const navigatorWithUAData = navigator as NavigatorWithUAData
  const brands = navigatorWithUAData.userAgentData?.brands || []
  const windowKeys = Object.getOwnPropertyNames(window)
  const cdcArtifacts = windowKeys.filter(
    (key) =>
      key.startsWith('cdc_') ||
      key === '__webdriver_script_fn' ||
      key === '__playwright__binding__' ||
      key === '__pwInitScripts',
  ).length

  return {
    webdriver: Boolean(navigator.webdriver),
    headlessUa: /headless/i.test(userAgent),
    headlessBrand: brands.some((entry) => /headless/i.test(entry.brand)),
    playwright:
      '__playwright__binding__' in window || '__pwInitScripts' in window,
    selenium:
      '_Selenium_IDE_Recorder' in window ||
      'callPhantom' in window ||
      'domAutomation' in window ||
      'domAutomationController' in window,
    cdcArtifacts,
    emptyPlugins: (navigator.plugins?.length || 0) === 0,
    emptyLanguages: (navigator.languages?.length || 0) === 0,
    path: window.location.pathname,
  }
}

export function AutomationSignalsReporter() {
  useEffect(() => {
    const signals = collectAutomationSignals()
    const hasSuspiciousSignals =
      signals.webdriver ||
      signals.headlessUa ||
      signals.headlessBrand ||
      signals.playwright ||
      signals.selenium ||
      signals.cdcArtifacts > 0 ||
      signals.emptyPlugins ||
      signals.emptyLanguages

    if (!hasSuspiciousSignals) {
      return
    }

    const body = JSON.stringify(signals)

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/security/automation-signal',
        new Blob([body], { type: 'application/json' }),
      )
      return
    }

    void fetch('/api/security/automation-signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      credentials: 'same-origin',
      keepalive: true,
    })
  }, [])

  return null
}
