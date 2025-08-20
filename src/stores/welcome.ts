import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useMintsStore } from './mints'

export const LAST_WELCOME_SLIDE = 5

export const useWelcomeStore = defineStore('welcome', {
  state: () => ({
    showWelcome: useLocalStorage('cashu.welcome.show', true),
    currentSlide: useLocalStorage('cashu.welcome.slide', 0),
    seedPhraseValidated: useLocalStorage('cashu.welcome.seedValidated', false),
    walletRestored: useLocalStorage('cashu.welcome.walletRestored', false),
    termsAccepted: useLocalStorage('cashu.welcome.termsAccepted', false),
    nostrSetupCompleted: useLocalStorage('cashu.welcome.nostrSetupCompleted', false),
    mintConnected: useLocalStorage('cashu.welcome.mintConnected', false),
    featuresVisited: useLocalStorage('cashu.welcome.featuresVisited', {
      creatorHub: false,
      subscriptions: false,
      buckets: false,
    }),
  }),
  actions: {
    walletHasAtLeastOneMint(): boolean {
      const mints = useMintsStore()
      return mints.mints.length > 0
    },
    canProceed(slide: number): boolean {
      switch (slide) {
        case 0:
        case 1:
        case 2:
          return true
        case 3:
          return this.seedPhraseValidated || this.walletRestored
        case 4:
          return this.mintConnected || this.walletHasAtLeastOneMint()
        case 5:
          return this.termsAccepted
        default:
          return false
      }
    },
    closeWelcome() {
      this.showWelcome = false
      this.currentSlide = 0
    },
  },
})
