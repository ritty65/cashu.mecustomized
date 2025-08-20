import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWelcomeStore } from '../../../src/stores/welcome'
import { useMintsStore } from '../../../src/stores/mints'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('welcome store gating', () => {
  it('enforces slide requirements', () => {
    const w = useWelcomeStore()
    const mints = useMintsStore()
    expect(w.canProceed(0)).toBe(true)
    expect(w.canProceed(1)).toBe(true)
    expect(w.canProceed(2)).toBe(true)
    expect(w.canProceed(3)).toBe(false)
    w.seedPhraseValidated = true
    expect(w.canProceed(3)).toBe(true)
    w.seedPhraseValidated = false
    w.walletRestored = true
    expect(w.canProceed(3)).toBe(true)
    w.walletRestored = false
    expect(w.canProceed(4)).toBe(false)
    w.mintConnected = true
    expect(w.canProceed(4)).toBe(true)
    w.mintConnected = false
    mints.mints = [{ url: 'https://mint' } as any]
    expect(w.canProceed(4)).toBe(true)
    mints.mints = []
    expect(w.canProceed(5)).toBe(false)
    w.termsAccepted = true
    expect(w.canProceed(5)).toBe(true)
  })
})
