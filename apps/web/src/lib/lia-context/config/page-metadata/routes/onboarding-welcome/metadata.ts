import type { PageMetadata } from '../../types';
import { onboardingWelcomeComponents } from './components';
import { onboardingWelcomeApis } from './apis';
import { onboardingWelcomeUserFlows } from './user-flows';
import { onboardingWelcomeCommonIssues } from './common-issues';

export const onboardingWelcomeMetadata: PageMetadata = {
  route: '/welcome',
  routePattern: '/welcome',
  pageType: 'onboarding_welcome',
  components: onboardingWelcomeComponents,
  apis: onboardingWelcomeApis,
  userFlows: onboardingWelcomeUserFlows,
  commonIssues: onboardingWelcomeCommonIssues,
};
