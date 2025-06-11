import { v4 as uuidv4 } from 'uuid'

export function buildHtlcSecret(hashHex: string, locktime?: number) {
  return JSON.stringify([
    'HTLC',
    {
      nonce: uuidv4().replace(/-/g, ''),
      data: hashHex,
      tags: locktime ? [['locktime', locktime.toString()]] : []
    }
  ])
}
