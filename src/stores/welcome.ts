import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useNostrStore } from './nostr'
import { useMintsStore } from './mints'
import { useProofsStore } from './proofs'
import { LOCAL_STORAGE_KEYS } from 'src/constants/localStorageKeys'

const DEFAULT_MINT_URL = 'https://mint.example.com'

export const useWelcomeStore = defineStore('welcome', {
  state: () => ({
    welcomeCompleted: useLocalStorage<boolean>('cashu.welcome.completed', false).value,
    nostrSetupComplete: useLocalStorage<boolean>(
      LOCAL_STORAGE_KEYS.CASHU_WELCOME_NOSTRSETUPCOMPLETE,
      false,
    ).value,
    recommendedMintUrl: process.env.RECOMMENDED_MINT_URL || DEFAULT_MINT_URL,
  }),
  getters: {
    nostrReady(): boolean {
      return this.nostrSetupComplete || !!useNostrStore().pubkey
    },
    hasIdentity(): boolean {
      return this.nostrReady
    },
    identitySource: () => {
      const s = (useNostrStore() as any).signerType
      return s ? String(s).toLowerCase() : null
    },
    hasMint: () => !!useMintsStore().activeMintUrl,
    balanceSats: () =>
      useProofsStore().proofs.reduce((sum, p) => sum + p.amount, 0),
    canFinish(): boolean {
      return this.hasIdentity && this.hasMint
    },
  },
  actions: {
    markWelcomeCompleted() {
      this.welcomeCompleted = true
    },
    markNostrSetupComplete() {
      this.nostrSetupComplete = true
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CASHU_WELCOME_NOSTRSETUPCOMPLETE,
        'true',
      )
    },
  },
})
