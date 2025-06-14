import { describe, it, expect } from 'vitest'
import { getEncodedToken, getEncodedTokenV3 } from '@cashu/cashu-ts'
import type { Token } from '@cashu/cashu-ts/dist/lib/es6/model/types/wallet/tokens'


describe('getEncodedTokenV3', () => {
  it('encodes to the same value as getEncodedToken(token, { version: 3 })', () => {
    const token: Token = {
      mint: 'https://example.com',
      proofs: [{ id: '00', amount: 1, secret: 's', C: 'c' }],
      unit: 'sat',
      memo: 'test'
    }
    const expected = getEncodedToken(token, { version: 3 })
    expect(getEncodedTokenV3(token)).toBe(expected)
  })
})
