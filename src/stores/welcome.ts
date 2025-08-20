import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useNostrStore } from './nostr'
import { useMintsStore } from './mints'
import { useProofsStore } from './proofs'

const DEFAULT_MINT_URL = 'https://mint.example.com'

export const useWelcomeStore = defineStore('welcome', {
  state: () => ({
    welcomeCompleted: useLocalStorage<boolean>('cashu.welcome.completed', false).value,
    recommendedMintUrl: process.env.RECOMMENDED_MINT_URL || DEFAULT_MINT_URL,
  }),
  getters: {
    hasIdentity: () => !!useNostrStore().pubkey,
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
  },
})
