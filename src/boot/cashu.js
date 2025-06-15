// src/boot/cashu.js
// Quasar boot file that configures axios used by @cashu/cashu-ts.
// Runs once on app start.

import { boot } from 'quasar/wrappers';

// Nothing needed – cashu-ts ships with its own fetch-based client now.
export default boot(() => {});
