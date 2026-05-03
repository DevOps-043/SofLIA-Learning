import { getConfig } from './config';

function mask(value?: string) {
  if (!value) return 'missing';
  if (value.length <= 10) return 'configured';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function has(value?: string) {
  return value && value.trim().length > 0;
}

function main() {
  const config = getConfig();
  const missing: string[] = [];

  if (!has(config.baseUrl)) missing.push('LOAD_BASE_URL');
  if (!has(config.supabaseUrl)) missing.push('LOAD_TEST_SUPABASE_URL');
  if (!has(config.supabaseServiceRoleKey)) missing.push('LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY');

  console.log('Load test configuration');
  console.log(`- LOAD_ENV_FILE: ${process.env.LOAD_ENV_FILE || '.env.load-test'}`);
  console.log(`- LOAD_BASE_URL: ${config.baseUrl || 'missing'}`);
  console.log(`- LOAD_CONFIRM_STAGING: ${config.confirmStaging}`);
  console.log(`- LOAD_RUN_ID: ${config.runId}`);
  console.log(`- LOAD_TARGET_VUS: ${config.targetVus}`);
  console.log(`- LOAD_SEED_USERS: ${config.seedUsers}`);
  console.log(`- LOAD_AI_RATIO: ${config.aiRatio}`);
  console.log(`- LOAD_TEST_ORG_SLUG: ${config.orgSlug}`);
  console.log(`- LOAD_TEST_SUPABASE_URL: ${config.supabaseUrl || 'missing'}`);
  console.log(`- LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY: ${mask(config.supabaseServiceRoleKey)}`);
  console.log(`- LOAD_NETLIFY_SITE_ID: ${config.netlifySiteId || 'optional'}`);
  console.log(`- LOAD_NETLIFY_TOKEN: ${mask(config.netlifyToken)}`);

  if (missing.length > 0) {
    console.error(`Missing required values: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('Configuration looks ready.');
}

main();
