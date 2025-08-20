import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useSignerStore } from './signer'
import { useMintsStore } from './mints'
import { useProofsStore } from './proofs'
import { useCreatorProfileStore } from './creatorProfile'

export type UserRole = 'supporter' | 'creator' | 'wallet-only' | null

const backupKey = 'cashu.backup.completed'

export const useWelcomeStore = defineStore('welcome', {
  state: () => ({
    firstRun: true as boolean,
    role: useLocalStorage<UserRole>('cashu.welcome.role', null).value,
    welcomeCompleted: useLocalStorage<boolean>('cashu.welcome.completed', false).value,
    termsAccepted: useLocalStorage<boolean>(
      'cashu.welcome.termsAccepted',
      false,
    ).value,
  }),
  getters: {
    hasKey: () => {
      const signer = useSignerStore()
      return signer.method !== null
    },
    hasBackup: () => localStorage.getItem(backupKey) === 'true',
    hasMint: () => {
      const mints = useMintsStore()
      return mints.mints.length > 0
    },
    hasBalance: () => {
      const proofs = useProofsStore()
      return proofs.proofs.reduce((s, p) => s + p.amount, 0) > 0
    },
    hasProfile: () => {
      const profile = useCreatorProfileStore()
      return !!profile.display_name
    },
  },
  actions: {
    setRole(role: UserRole) {
      this.role = role
    },
    markWelcomeCompleted() {
      this.welcomeCompleted = true
    },
    setTermsAccepted(val: boolean) {
      this.termsAccepted = val
      localStorage.setItem('cashu.welcome.termsAccepted', String(val))
    },
  },
})
