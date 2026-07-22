import type { ReactNode } from 'react'
import { AutomationSignalsReporter } from '@/components/security/AutomationSignalsReporter'
import { ContentWrapper } from '../core/components/ContentWrapper'
import { MotionGuardProvider } from '../core/components/MotionGuardProvider'
import { OnboardingAgent } from '../core/components/OnboardingAgent'
import { PrefetchManager } from '../core/components/PrefetchManager'
import { ThemeProvider } from '../core/components/ThemeProvider'
import { LiaPanelProvider } from '../core/contexts/LiaPanelContext'
import { TourRestartProvider } from '../core/contexts/TourRestartContext'
import { I18nProvider } from '../core/providers/I18nProvider'
import { OrganizationProvider } from '../core/providers/OrganizationProvider'
import { ShareModalProvider } from '../core/providers/ShareModalProvider'
import { SWRProvider } from '../core/providers/SWRProvider'
import { AuthSecurityGuard } from '../features/auth/components/AuthSecurityGuard'
import { OrganizationStylesProvider } from '../features/business-panel/contexts/OrganizationStylesContext'
import { NotificationProvider } from '../features/notifications/context/NotificationContext'
import { TourProvider } from '../features/tours/TourProvider'

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SWRProvider>
      <I18nProvider>
        <ThemeProvider>
          <MotionGuardProvider>
            <ShareModalProvider>
              <NotificationProvider pollingInterval={60000}>
                <OrganizationProvider>
                  <OrganizationStylesProvider>
                    <TourRestartProvider>
                      <TourProvider>
                        <LiaPanelProvider>
                          <PrefetchManager />
                          <AutomationSignalsReporter />
                          <AuthSecurityGuard>
                            <ContentWrapper>{children}</ContentWrapper>
                          </AuthSecurityGuard>
                          <OnboardingAgent />
                        </LiaPanelProvider>
                      </TourProvider>
                    </TourRestartProvider>
                  </OrganizationStylesProvider>
                </OrganizationProvider>
              </NotificationProvider>
            </ShareModalProvider>
          </MotionGuardProvider>
        </ThemeProvider>
      </I18nProvider>
    </SWRProvider>
  )
}
