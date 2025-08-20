import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWelcomeStore } from '../../../src/stores/welcome'
import { useNostrStore } from '../../../src/stores/nostr'
import { useMintsStore } from '../../../src/stores/mints'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('welcome store', () => {
  it('canFinish reacts to identity and mint', () => {
    const welcome = useWelcomeStore()
    const nostr = useNostrStore()
    const mints = useMintsStore()
    expect(welcome.canFinish).toBe(false)
    nostr.pubkey = 'pk'
    expect(welcome.canFinish).toBe(false)
    mints.activeMintUrl = 'https://mint'
    expect(welcome.canFinish).toBe(true)
  })
})
