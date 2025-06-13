export * from '@cashu/cashu-ts';
import type { Token } from '@cashu/cashu-ts';
import { getEncodedToken } from '@cashu/cashu-ts';

export function getEncodedTokenV3(token: Token) {
  return getEncodedToken(token, { version: 3 });
}
