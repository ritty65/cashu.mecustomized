// Re-export the package but add Cashu.me specific helpers.
// Import from the real package path to avoid alias loops.
export * from '@cashu/cashu-ts/dist/lib/es6/index.js';
import type { Token } from '@cashu/cashu-ts/dist/lib/es6/index.js';
import { getEncodedToken } from '@cashu/cashu-ts/dist/lib/es6/index.js';

export function getEncodedTokenV3(token: Token) {
  return getEncodedToken(token, { version: 3 });
}
