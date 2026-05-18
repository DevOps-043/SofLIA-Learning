import { logger as techDebtLogger } from '@/lib/utils/logger'
import { testContextBuilderWithNewProviders } from './optional-context-tests/context-builder.suite'
import { testContextMetricsService } from './optional-context-tests/metrics.suite'
import { testLiaComponentUtilities } from './optional-context-tests/lia-components.suite'
import { testNewPageMetadata } from './optional-context-tests/page-metadata.suite'
import { testPlatformContextProvider } from './optional-context-tests/platform-provider.suite'
import { runSuites } from './optional-context-tests/runner'
import { testUserContextProvider } from './optional-context-tests/user-provider.suite'

void runSuites('TESTS DE FUNCIONALIDADES OPCIONALES DE LIA', [
  { name: 'pageMetadata', run: testNewPageMetadata },
  { name: 'userProvider', run: testUserContextProvider },
  { name: 'platformProvider', run: testPlatformContextProvider },
  { name: 'metrics', run: testContextMetricsService },
  { name: 'utilities', run: testLiaComponentUtilities },
  { name: 'builder', run: testContextBuilderWithNewProviders },
]).catch(techDebtLogger.error)
