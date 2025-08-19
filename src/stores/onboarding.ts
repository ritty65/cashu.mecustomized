import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import router from 'src/router';

export type OnboardingCTA = {
  labelKey: string;
  action: 'route' | 'emit' | 'openModal';
  to?: string;
  params?: Record<string, any>;
  eventName?: string;
  variant?: 'primary' | 'secondary';
  guarded?: boolean;
};

export type OnboardingStep = {
  id: number;
  titleKey: string;
  subtitleKey?: string;
  bodyKey?: string;
  bulletsKeys?: string[];
  ctas?: OnboardingCTA[];
  icon?: 'vision' | 'nostr' | 'mint' | 'deposit' | 'pay' | 'creator' | 'safety';
};

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    isNewOnboardingEnabled: true,
    hasCompletedOnboarding: useLocalStorage<boolean>('cashu.onboarding.completed', false).value,
    currentStep: useLocalStorage<number>('cashu.onboarding.currentStep', 0).value,
    steps: [] as OnboardingStep[],
  }),
  getters: {
    totalSteps: (state) => state.steps.length,
    isLastStep: (state) => state.currentStep === state.steps.length - 1,
  },
  actions: {
    setSteps(steps: OnboardingStep[]) {
      this.steps = steps;
    },
    goPrev() {
      if (this.currentStep > 0) this.currentStep -= 1;
    },
    goNext() {
      if (this.isLastStep) {
        this.finish();
      } else {
        this.currentStep += 1;
      }
    },
    skip() {
      this.finish();
    },
    finish() {
      this.hasCompletedOnboarding = true;
      router.push('/wallet');
    },
    reset() {
      this.currentStep = 0;
      this.hasCompletedOnboarding = false;
    },
  },
});

