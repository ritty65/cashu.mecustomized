import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    isNewOnboardingEnabled: true,
    hasCompletedOnboarding: useLocalStorage<boolean>('cashu.onboarding.completed', false),
  }),
  actions: {
    complete() {
      this.hasCompletedOnboarding = true;
    },
    reset() {
      this.hasCompletedOnboarding = false;
    },
  },
});
