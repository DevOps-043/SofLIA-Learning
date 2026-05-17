import type { PageMetadata } from '../types';

import { BusinessAdminPagesMetadata } from './business-admin-pages';
import { BusinessLearningPagesMetadata } from './business-learning-pages';
import { BusinessUserPagesMetadata } from './business-user-pages';
import { CorePagesMetadata } from './core-pages';
import { UserPagesMetadata } from './user-pages';

export const PAGE_METADATA: Record<string, PageMetadata> = {
  ...CorePagesMetadata,
  ...UserPagesMetadata,
  ...BusinessAdminPagesMetadata,
  ...BusinessLearningPagesMetadata,
  ...BusinessUserPagesMetadata,
};
