import { runLoadTest } from './run/main';

runLoadTest().catch((error) => {
  console.error(error);
  process.exit(1);
});
