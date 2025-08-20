import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNWCStore } from '../../../src/stores/nwc'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('nwc store', () => {
  it('updates allowance', () => {
    const store = useNWCStore()
    store.connections = [{
      walletPublicKey: 'a',
      connectionSecret: '',
      connectionPublicKey: 'b',
      allowanceLeft: 1,
    } as any]
    store.updateConnectionAllowance('a', 5)
    expect(store.connections[0].allowanceLeft).toBe(5)
  })
})
