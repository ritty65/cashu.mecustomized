import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWelcomeStore } from '../../../src/stores/welcome'
import { useSignerStore } from '../../../src/stores/signer'
import { useMintsStore } from '../../../src/stores/mints'
import { useProofsStore } from '../../../src/stores/proofs'
import { useCreatorProfileStore } from '../../../src/stores/creatorProfile'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('welcome store', () => {
  it('hasKey reflects signer state', () => {
    const signer = useSignerStore()
    const store = useWelcomeStore()
    expect(store.hasKey).toBe(false)
    signer.method = 'local'
    expect(store.hasKey).toBe(true)
  })

  it('hasBackup reads from localStorage', () => {
    localStorage.setItem('cashu.backup.completed', 'true')
    const store = useWelcomeStore()
    expect(store.hasBackup).toBe(true)
  })

  it('hasMint detects configured mints', () => {
    const mints = useMintsStore()
    mints.mints.push({ url: 'https://mint', keys: [], keysets: [] } as any)
    const store = useWelcomeStore()
    expect(store.hasMint).toBe(true)
  })

  it('hasBalance checks proofs', () => {
    const proofs = useProofsStore()
    proofs.proofs.push({ amount: 1 } as any)
    const store = useWelcomeStore()
    expect(store.hasBalance).toBe(true)
  })

  it('hasProfile detects creator profile', () => {
    const profile = useCreatorProfileStore()
    profile.display_name = 'Alice'
    const store = useWelcomeStore()
    expect(store.hasProfile).toBe(true)
  })

  it('setRole and markWelcomeCompleted update state', () => {
    const store = useWelcomeStore()
    store.setRole('supporter')
    expect(store.role).toBe('supporter')
    store.markWelcomeCompleted()
    expect(store.welcomeCompleted).toBe(true)
  })

  it('termsAccepted persists', () => {
    const store = useWelcomeStore()
    expect(store.termsAccepted).toBe(false)
    store.setTermsAccepted(true)
    const stored = localStorage.getItem('cashu.welcome.termsAccepted')
    expect(stored).toBe('true')
  })
})
