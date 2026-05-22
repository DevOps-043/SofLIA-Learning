'use client'

import { useEffect, useId, useState } from 'react'
import Script from 'next/script'

interface HumanVerificationFieldProps {
  onTokenChange: (token: string) => void
}

type CaptchaProvider =
  | { name: 'turnstile'; scriptUrl: string; siteKey: string }
  | { name: 'hcaptcha'; scriptUrl: string; siteKey: string }

type CaptchaWindow = Window & Record<string, unknown>

export function HumanVerificationField({ onTokenChange }: HumanVerificationFieldProps) {
  const provider = getCaptchaProvider()
  const instanceId = useId().replace(/[^a-zA-Z0-9_]/g, '_')
  const [token, setToken] = useState('')
  const callbackName = `sofliaCaptchaDone_${instanceId}`
  const expiredCallbackName = `sofliaCaptchaExpired_${instanceId}`

  useEffect(() => {
    if (!provider) return undefined

    const captchaWindow = window as unknown as CaptchaWindow
    captchaWindow[callbackName] = (nextToken: string) => {
      setToken(nextToken)
      onTokenChange(nextToken)
    }
    captchaWindow[expiredCallbackName] = () => {
      setToken('')
      onTokenChange('')
    }

    return () => {
      delete captchaWindow[callbackName]
      delete captchaWindow[expiredCallbackName]
    }
  }, [callbackName, expiredCallbackName, onTokenChange, provider])

  if (!provider) return null

  return (
    <div className="flex justify-center">
      <Script src={provider.scriptUrl} strategy="lazyOnload" async defer />
      <div
        className={provider.name === 'turnstile' ? 'cf-turnstile' : 'h-captcha'}
        data-sitekey={provider.siteKey}
        data-callback={callbackName}
        data-expired-callback={expiredCallbackName}
        data-theme="auto"
      />
      <input type="hidden" name="captchaToken" value={token} readOnly />
    </div>
  )
}

function getCaptchaProvider(): CaptchaProvider | null {
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return {
      name: 'turnstile',
      scriptUrl: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
      siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    }
  }

  if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
    return {
      name: 'hcaptcha',
      scriptUrl: 'https://js.hcaptcha.com/1/api.js',
      siteKey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
    }
  }

  return null
}
