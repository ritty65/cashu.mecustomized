// src/boot/cashu.js
// Quasar boot file that configures axios used by @cashu/cashu-ts.
// Runs once on app start.

import { boot } from 'quasar/wrappers';
import { setupAxios } from '@cashu/cashu-ts';

export default boot(() => {
  // 15-second network timeout for all Cashu mint requests.
  setupAxios({ timeout: 15_000 });
});
