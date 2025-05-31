import { describe, it, expect, beforeEach } from 'vitest'
import { useProofsStore } from '../../../src/stores/proofs'
import { cashuDb } from '../../../src/stores/dexie'

beforeEach(async () => {
  await cashuDb.delete()
  await cashuDb.open()
})

describe('Proofs store', () => {
  it('updateProofBucket updates proof bucket', async () => {
    const proofs = useProofsStore()
    await proofs.addProofs([{ id: 'a', amount: 1, C: 'c1', secret: 's1' }], undefined, 'b1')
    await proofs.updateProofBucket('s1', 'b2')
    const stored = await cashuDb.proofs.get('s1')
    expect(stored?.bucketId).toBe('b2')
  })

  it('moveProofs updates multiple proofs', async () => {
    const store = useProofsStore()
    const sample = [
      { id: 'a', amount: 1, C: 'c1', secret: 's1' },
      { id: 'a', amount: 2, C: 'c2', secret: 's2' }
    ]
    await store.addProofs(sample)
    const toMove = await cashuDb.proofs.toArray()
    await store.moveProofs(toMove, 'b3')
    const updated = await cashuDb.proofs.toArray()
    expect(updated.every(p => p.bucketId === 'b3')).toBe(true)
  })
})
